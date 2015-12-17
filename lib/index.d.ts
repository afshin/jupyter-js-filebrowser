import { IContents, IContentsModel } from 'jupyter-js-services';
import { Message } from 'phosphor-messaging';
import { IChangedArgs } from 'phosphor-properties';
import { ISignal, Signal } from 'phosphor-signaling';
import { Widget } from 'phosphor-widget';
/**
 * An implementation of a file browser view model.
 */
export declare class FileBrowserViewModel {
    /**
     * A signal emitted when an item changes.
     */
    static changedSignal: Signal<FileBrowserViewModel, IChangedArgs<IContentsModel>>;
    /**
     * Construct a new file browser view model.
     */
    constructor(path: string, contents: IContents);
    /**
     * Get the item changed signal.
     */
    changed: ISignal<FileBrowserViewModel, IChangedArgs<IContentsModel>>;
    /**
     * Get the current path.
     */
    /**
     * Set the current path, triggering a refresh.
     */
    path: string;
    /**
     * Get the current items.
     *
     * #### Notes
     * This is a read-only property.
     */
    items: IContentsModel[];
    /**
     * Get the selected indices.
     */
    /**
     * Set the selected indices.
     */
    selected: number[];
    /**
     * Open the current selected items.
     *
     * Emits an [[changed]] signal for each item after loading the contents.
     */
    open(): void;
    /**
     * Create a new untitled file or directory in the current directory.
     *
     * @param type - The type of file object to create. One of ['file',
     *   'notebook', 'directory'].
     *
     * @returns A promise containing the new file contents model.
     */
    newUntitled(type: string): Promise<IContentsModel>;
    /**
     * Rename a file or directory.
     *
     * @param path - The path to the original file.
     *
     * @param newPath - The path to the new file.
     *
     * @param overwrite - Whether to overwrite an exisiting file.
     *
     * @returns A promise containing the new file contents model.
     *
     * #### Notes
     * The default behavior is for all paths to be interpreted as relative to
     * the current directory.  A leading `/` indicates an absolute path.
     */
    rename(path: string, newPath: string, overwrite?: boolean): Promise<IContentsModel>;
    /**
     * Upload a `File` object.
     *
     * @param file - The `File` object to upload.
     *
     * @param overwrite - Whether to overwrite an existing file.
     *
     * @returns A promise containing the new file contents model.
     *
     * #### Notes
     * This will fail to upload files that are too big to be sent in one
     * request to the server.
     */
    upload(file: File, overwrite?: boolean): Promise<IContentsModel>;
    /**
     * Refresh the model contents.
     *
     * Emits a [changed] signal with the new content.
     */
    refresh(): void;
    /**
     * Rename a file, without checking for existing file.
     */
    private _rename(path, newPath);
    /**
     * Upload a `File` object without checking for file size or existing file.
     */
    private _upload(file);
    private _max_upload_size_mb;
    private _selectedIndices;
    private _contents;
    private _model;
}
/**
 * A widget which hosts a file browser.
 *
 * The widget uses the Jupyter Contents API to retreive contents,
 * and presents itself as a flat list of files and directories with
 * breadcrumbs.
 */
export declare class FileBrowser extends Widget {
    /**
     * Create a new node for the file list.
     */
    static createNode(): HTMLElement;
    /**
     * Construct a new file browser widget.
     *
     * @param model - File browser view model instance.
     */
    constructor(model: FileBrowserViewModel);
    /**
     * Dispose of the resources held by the file browser.
     */
    dispose(): void;
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
    handleEvent(event: Event): void;
    /**
     * A message handler invoked on an `'after-attach'` message.
     */
    protected onAfterAttach(msg: Message): void;
    /**
     * A message handler invoked on a `'before-detach'` message.
     */
    protected onBeforeDetach(msg: Message): void;
    /**
     * A handler invoked on an `'update-request'` message.
     */
    protected onUpdateRequest(msg: Message): void;
    /**
     * Handle the `'mousedown'` event for the file browser.
     */
    private _evtMousedown(event);
    /**
     * Handle the `'mouseup'` event for the file browser.
     */
    private _evtMouseup(event);
    /**
     * Handle the `'mousemove'` event for the file browser.
     */
    private _evtMousemove(event);
    /**
     * Handle the `'click'` event for the file browser.
     */
    private _evtClick(event);
    /**
     * Handle the `'dblclick'` event for the file browser.
     */
    private _evtDblClick(event);
    /**
     * Handle the `'p-dragenter'` event for the dock panel.
     */
    private _evtDragEnter(event);
    /**
     * Handle the `'p-dragleave'` event for the dock panel.
     */
    private _evtDragLeave(event);
    /**
     * Handle the `'p-dragover'` event for the dock panel.
     */
    private _evtDragOver(event);
    /**
     * Handle the `'p-drop'` event for the dock panel.
     */
    private _evtDrop(event);
    /**
     * Start a drag event.
     */
    private _startDrag(index, clientX, clientY);
    /**
     * Find the appropriate target for a mouse event.
     */
    private _findTarget(event);
    /**
     * Get the path of an item based on a mouse event.
     */
    private _getPath(event);
    /**
     * Handle a click on a file node.
     */
    private _handleFileClick(event, index);
    /**
     * Update the selected indices of the model.
     */
    private _updateSelected();
    /**
     * Handle a file upload event.
     */
    private _handleUploadEvent(event);
    /**
     * Handle a "new" command execution.
     */
    private _handleNewCommand(type);
    /**
     * Allow the user to rename item on a given row.
     */
    private _doRename(row);
    private _showErrorMessage(title, message);
    /**
     * Handle a `changed` signal from the model.
     */
    private _onChanged(model, change);
    private _model;
    private _items;
    private _crumbs;
    private _crumbSeps;
    private _buttons;
    private _newMenu;
    private _pendingSelect;
    private _editNode;
    private _drag;
    private _dragData;
}
