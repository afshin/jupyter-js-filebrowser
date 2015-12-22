/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, Jupyter Development Team.
|
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/
'use-strict';

import {
  EditorModel, EditorWidget
} from 'jupyter-js-editor';

import {
  FileBrowserWidget, FileBrowserViewModel
} from 'jupyter-js-filebrowser';

import {
  ContentsManager, ISessionOptions, NotebookSessionManager
} from 'jupyter-js-services';

import {
  SplitPanel
} from 'phosphor-splitpanel';

import {
  Widget
} from 'phosphor-widget';


function main(): void {

  let baseUrl = 'http://localhost:8888'
  let contents = new ContentsManager(baseUrl);
  let sessions = new NotebookSessionManager({ baseUrl: baseUrl });

  let fbModel = new FileBrowserViewModel('', contents, sessions);
  let fileBrowser = new FileBrowserWidget(fbModel);

  var editorModel = new EditorModel();
  let editor = new EditorWidget(editorModel);

  fbModel.changed.connect((fb, change) => {
    if (change.name === 'open' && change.newValue.type === 'file') {
      (editor as any)._editor.getDoc().setValue(change.newValue.content);
    }
  });

  let panel = new SplitPanel();
  panel.addChild(fileBrowser);
  panel.addChild(editor);

  // Start a default session.
  contents.newUntitled('', { type: 'notebook' }).then(content => {
    sessions.startNew({ notebookPath: content.path }).then(() => {
      panel.attach(document.body);
    });
  });

  window.onresize = () => panel.update();
}


main();
