import dialogPolyfill from 'dialog-polyfill'
import 'dialog-polyfill/dialog-polyfill.css'
import 'fullscreen-polyfill'

const hintsDialog = document.querySelector<HTMLDialogElement>('#hints-dialog')!
const settingsDialog = document.querySelector<HTMLDialogElement>('#settings-dialog')!
const levelInfoEditor = document.querySelector<HTMLDialogElement>('#level-info-editor')!
const dialogs = [hintsDialog, settingsDialog, levelInfoEditor]

for (const dialog of dialogs) {
  dialogPolyfill.registerDialog(dialog)
  // dialog.hidden = true
  // dialog.style.display = 'none'
}

let id = 1
// @ts-ignore violating template string type for UUIDs
window.crypto.randomUUID ??= () => 'fake polyfilled randomUUID: ' + (id++).toString()
