// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import {
  IContentsModel
} from 'jupyter-js-services';

import {
  showDialog
} from 'jupyter-js-domutils';

import {
  Menu, MenuItem
} from 'phosphor-menus';

import {
  Widget
} from 'phosphor-widget';

import {
  FileBrowserModel
} from './model';

import * as utils
  from './utils';


/**
 * The class name added to the button node.
 */
const BUTTON_CLASS = 'jp-FileButtons';

/**
 * The class name added to the button nodes.
 */
const BUTTON_ITEM_CLASS = 'jp-FileButtons-item';

/**
 * The class name added to the button icon nodes.
 */
const BUTTON_ICON_CLASS = 'jp-FileButtons-icon';

/**
 * The class name added to the upload button node.
 */
const UPLOAD_CLASS = 'jp-FileButtons-upload';

/**
 * The class name added to the drop icon node.
 */
const DROP_ICON_CLASS = 'jp-FileButtons-drop';


/**
 * A widget which host the file browser buttons.
 */
export
class FileButtons extends Widget {

  /**
   * Construct a new file browser buttons widget.
   *
   * @param model - The file browser view model.
   */
  constructor(model: FileBrowserModel) {
    super();
    this.addClass(BUTTON_CLASS);
    this._model = model;
    var buttons = Private.createButtons(this.node);
    let Button = Private.Button;

    // Set up events on the buttons.
    let input = buttons[Button.Upload].getElementsByTagName('input')[0];
    input.onchange = this._handleUploadEvent.bind(this);

    buttons[Button.Refresh].onclick = () => this._model.refresh();

    buttons[Button.New].onclick = () => {
      let rect = buttons[Button.New].getBoundingClientRect();
      this._newMenu.popup(rect.left, rect.bottom, false, true);
    }

    // Create the "new" menu.
    let handler = (item: MenuItem) => {
      let type = item.text.toLowerCase();
      if (type === 'text file') type = 'file';
      this._model.newUntitled(type).catch(error =>
        utils.showErrorMessage(this, 'New File Error', error)
       ).then(() => this._model.refresh());
    };
    this._newMenu = Private.createNewItemMenu(handler);

  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    this._model = null;
    this._newMenu.dispose();
    this._newMenu = null;
    super.dispose();
  }

  /**
   * Handle a file upload event.
   */
  private _handleUploadEvent(event: Event): void {
    let promises: Promise<IContentsModel>[] = [];
    for (var file of (event.target as any).files) {
      promises.push(this._model.upload(file).catch(error => {
        if (error.message.indexOf('already exists') !== -1) {
          let options = {
            title: 'Overwrite file?',
            host: this.parent.node,
            body: `"${file.name}" already exists, overwrite?`
          }
          return showDialog(options).then(button => {
            if (button.text === 'OK') {
              return this._model.upload(file, true);
            }
          });
        }
      }));
    }
    Promise.all(promises).then(
      () => this._model.refresh(),
      err => utils.showErrorMessage(this, 'Upload Error', err)
    );
  }

  private _newMenu: Menu = null;
  private _model: FileBrowserModel = null;
}


/**
 * The namespace for the buttons private data.
 */
namespace Private {
  /**
   * Button item list enum.
   */
  export
  enum Button {
    New,
    Upload,
    Refresh
  }

  /**
   * Create the button nodes.
   */
  export
  function createButtons(buttonBar: HTMLElement): HTMLElement[] {
    let buttons: HTMLElement[] = [];
    let icons = ['fa-plus', 'fa-upload', 'fa-refresh'];
    let titles = ['Create New...', 'Upload File(s)', 'Refresh File List'];
    for (let i = 0; i < 3; i++) {
      let button = document.createElement('button');
      button.className = BUTTON_ITEM_CLASS;
      button.title = titles[i];
      let icon = document.createElement('span');
      icon.className = BUTTON_ICON_CLASS + ' fa ' + icons[i];
      button.appendChild(icon);
      buttonBar.appendChild(button);
      buttons.push(button);
    }

    // Add the dropdown node to the "new file" button.
    var dropIcon = document.createElement('span');
    dropIcon.className = DROP_ICON_CLASS + ' fa fa-caret-down';
    buttons[Button.New].appendChild(dropIcon);

    // Create the hidden upload input field.
    let file = document.createElement('input');
    file.style.height = "100%";
    file.style.zIndex = "10000";
    file.setAttribute("type", "file");
    file.setAttribute("multiple", "multiple");
    buttons[Button.Upload].classList.add(UPLOAD_CLASS);
    buttons[Button.Upload].appendChild(file);
    return buttons;
  }

  /**
   * Create the "new" menu.
   */
  export
  function createNewItemMenu(handler: (item: MenuItem) => void): Menu {
    return new Menu([
      new MenuItem({
        text: 'Notebook',
        handler: handler,
      }),
      new MenuItem({
        text: 'Text File',
        handler: handler,
      }),
      new MenuItem({
        text: 'Directory',
        handler: handler,
      })
    ]);
  }
}
