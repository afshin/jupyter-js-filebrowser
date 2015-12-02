// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use-strict';

import {
  IContents, INotebookSession, ISessionId, ISessionOptions
} from 'jupyter-js-services';

import {
  hitTest
} from 'phosphor-domutil';

import {
  Message
} from 'phosphor-messaging';

import {
  Widget
} from 'phosphor-widget';

import './index.css';


/**
 * The class name added to FileBrowser instances.
 */
const FILE_BROWSER_CLASS = 'jp-FileBrowser';

/**
 * The class name added to FileBrowser rows.
 */
const LIST_AREA_CLASS = 'jp-FileBrowser-list-area';

/**
 * The class name added to FileBrowser rows.
 */
const ROW_CLASS = 'jp-FileBrowser-row';

/**
 * The class name added to selected rows.
 */
const SELECTED_CLASS = 'jp-mod-selected';

/**
 * The class name added to a row icon.
 */
const ROW_ICON_CLASS = 'jp-FileBrowser-item-icon'

/**
 * The class name added to a row text.
 */
const ROW_TEXT_CLASS = 'jp-FileBrowser-item-text'

/**
 * The class name added to a folder icon.
 */
const FOLDER_ICON_CLASS = 'jp-FileBrowser-folder-icon';

/**
 * The class name added to a file icon.
 */
const FILE_ICON_CLASS = 'jp-FileBrowser-file-icon';


/**
 * A view model associated with a Jupyter FileBrowser.
 */
export
interface IFileBrowserViewModel {
  /**
   * Get a list of running session models.
   */
  listRunningSessions: () => Promise<ISessionId[]>;

  /**
   * Connect to a session by session id and known options.
   */
  connectToSession: (id: string, options: ISessionOptions) => Promise<INotebookSession>;

  /**
   * Contents provider.
   */
  contents: IContents;

  /**
   * The current directory path.
   */
  currentDirectory: string;

  /**
   * The selected items in the current directory.
   */
  selectedItems: string[];
}


/**
 * A widget which hosts a file browser.
 *
 * The widget uses the Jupyter Contents API to retreive contents,
 * and presents itself as a flat list of files and directories with
 * breadcrumbs.
 */
export
class FileBrowser extends Widget {

  /**
   * Create a new node for the file list.
   */
  static createNode(): HTMLElement {
    let node = document.createElement('div');
    let child = document.createElement('div');
    child.classList.add(LIST_AREA_CLASS);
    node.appendChild(child);
    return node;
  }

  /**
   * Construct a new file browser widget.
   *
   * @param model - File browser view model instance.
   */
  constructor(model: IFileBrowserViewModel) {
    super();
    this._model = model;
    this.addClass(FILE_BROWSER_CLASS);
  }

  /**
   * Get the current directory of the file browser.
   */
  get directory(): string {
    return this._model.currentDirectory;
  }

  /**
   * Set the current directory of the file browser.
   *
   * @param path - The path of the new directory.
   */
  set directory(path: string) {
    this._model.currentDirectory = path;
  }

  /**
   * Get the selected items for the file browser.
   *
   * #### Notes
   * This is a read-only property.
   */
  get selectedItems(): string[] {
    return this._model.selectedItems;
  }

  /**
   * Open the currently selected item(s).
   *
   * #### Notes
   * Files are opened by emitting the [[openFile]] signal.
   *
   * If there is only one currently selected item, and it is a
   * directory, the widget will refresh with that directory's contents.
   *
   * If more than one directory is selected and no files are selected,
   * the top-most directory will be selected and refreshed.
   *
   * If one or more directories are selected in addition to one or
   * more files, the directories will be ignored and the files will
   * be opened.
   */
  open(): void {
    console.log('open');
  }

  /**
   * Handle the DOM events for the file browser.
   *
   * @param event - The DOM event sent to the panel.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the panel's DOM node. It should
   * not be called directly by user code.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
    case 'click':
      this._evtClick(event as MouseEvent);
      break;
    case 'dblclick':
      this._evtDblClick(event as MouseEvent);
      break;
    }
  }

  /**
   * A message handler invoked on an `'after-attach'` message.
   */
  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    let node = this.node;
    node.addEventListener('click', this);
    node.addEventListener('dblclick', this);
    this._listContents();
  }

  /**
   * A message handler invoked on a `'before-detach'` message.
   */
  protected onBeforeDetach(msg: Message): void {
    super.onBeforeDetach(msg);
    let node = this.node;
    node.removeEventListener('click', this);
    node.removeEventListener('dblclick', this);
  }

  /**
   * Handle the `'click'` event for the file browser.
   */
  private _evtClick(event: MouseEvent) {
    // Do nothing if it's not a left mouse press.
    if (event.button !== 0) {
      return;
    }

    // Find the target row.
    let rows = findByClass(this.node, ROW_CLASS);
    let node = hitTestNodes(rows, event.clientX, event.clientY);
    if (!node) {
      return;
    }

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Handle toggling.
    if (event.metaKey || event.ctrlKey) {
      toggleClass(node, SELECTED_CLASS);

    // Handle multiple select.
    } else if (event.shiftKey) {

      // Find the "nearest selected".
      let nearestIndex = -1;
      let index = -1;
      for (var i = 0; i < rows.length; i++) {
        if (rows[i] === node) {
          index = i;
          continue;
        }
        if (hasClass(rows[i], SELECTED_CLASS)) {
          if (nearestIndex === -1) {
            nearestIndex = i;
          } else {
            if (Math.abs(index - i) < Math.abs(nearestIndex - i)) {
              nearestIndex = i;
            }
          }
        }
      }

      // Default to the first element (and fill down).
      if (nearestIndex === -1) {
        nearestIndex = 0;
      }

      // Select the rows between the current and the nearest selected.
      for (var i = 0; i < rows.length; i++) {
        if (nearestIndex >= i && index <= i ||
            nearestIndex <= i && index >= i) {
          addClass(rows[i], SELECTED_CLASS);
        }
      }

    // Default to selecting the only the item.
    } else {

      for (let row of rows) {
        removeClass(row, SELECTED_CLASS);
      }
      addClass(node, SELECTED_CLASS);
    }

    // Set the selected items on the model.
    let items: string[] = [];
    for (let row of rows) {
      if (hasClass(row, SELECTED_CLASS)) {
        items.push(row.children[1].textContent);
      }
    }
    this._model.selectedItems = items;
  }

  /**
   * Handle the `'dblclick'` event for the file browser.
   */
  private _evtDblClick(event: MouseEvent) {
    // Do nothing if it's not a left mouse press.
    if (event.button !== 0) {
      return;
    }

    // Find the target row.
    let rows = findByClass(this.node, ROW_CLASS);
    let node = hitTestNodes(rows, event.clientX, event.clientY);
    if (!node) {
      return;
    }

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Open the selected item.
    this.open();
  }

  /**
   * List the contents of the current directory.
   */
  private _listContents() {
    let currentDir = this._model.currentDirectory;
    let contents = this._model.contents;

    this.node.firstChild.textContent = '';
    // Add a parent link if not at the root.
    if (currentDir.lastIndexOf('/') !== -1) {
      this._addItem('..', true);
    }

    let path = currentDir.slice(0, currentDir.length - 1);
    contents.listContents(path).then((msg: any) => {
      for (let i = 0; i < msg.content.length; i++) {
        if ((msg as any).content[i].type === 'directory') {
          this._addItem((msg as any).content[i].name + '/', true);
        } else {
          this._addItem((msg as any).content[i].name, false);
        }
      }
    });
  }

  /*
   * Add an item to the file browser display.
   *
   * @param text - The text to display for the item.
   * @param isDirectory - Whether the item is a directory.
   */
  private _addItem(text: string, isDirectory: boolean): void {
    let row = document.createElement('div');
    addClass(row, ROW_CLASS);

    let inode = document.createElement('i');
    addClass(inode, ROW_ICON_CLASS);
    // Add the appropriate icon based on whether it is a directory.
    if (isDirectory) {
      addClass(inode, FOLDER_ICON_CLASS);
    } else {
      addClass(inode, FILE_ICON_CLASS);
    }

    let lnode = document.createElement('div');
    addClass(lnode, ROW_TEXT_CLASS);
    lnode.textContent = text;

    row.appendChild(inode);
    row.appendChild(lnode);
    this.node.firstChild.appendChild(row);
  }

  private _model: IFileBrowserViewModel = null;
}


/**
 * Test whether a node contains a CSS class.
 */
function hasClass(node: HTMLElement, className: string): boolean {
  return node.classList.contains(className);
}


/**
 * Toggle a CSS class on a node.
 */
function toggleClass(node: HTMLElement, className: string): void {
  if (!hasClass(node, className)) {
    addClass(node, className);
  } else {
    removeClass(node, className);
  }
}


/**
 * Add a CSS class to a node.
 */
function addClass(node: HTMLElement, className: string): void {
  node.classList.add(className);
}


/**
 * Remove a CSS class from a node.
 */
function removeClass(node: HTMLElement, className: string): void {
  node.classList.remove(className);
}


/**
 * Find child nodes by CSS class name.
 */
function findByClass(node: HTMLElement, className: string): HTMLElement[] {
  let elements: HTMLElement[] = [];
  let nodeList = node.getElementsByClassName(className);
  for (let i = 0; i < nodeList.length; i++) {
    elements.push(nodeList[i] as HTMLElement);
  }
  return elements;
}


/**
 * Perform a client position hit test an array of nodes.
 *
 * Returns the first matching node, or `undefined`.
 */
function hitTestNodes(nodes: HTMLElement[], clientX: number, clientY: number): HTMLElement {
  for (let node of nodes) {
    if (hitTest(node, clientX, clientY)) {
      return node;
    }
  }
  return void 0;
}
