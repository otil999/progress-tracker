import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material"
import { useAppContext, useCategoryApi, useProjectApi } from "./AppContext.jsx"

export const ComboValueEditorDialog = () => {
    const { selectedProject, selectedCategoryId, dialog, setDialog } = useAppContext()
    const { createProject, updateProject } = useProjectApi()
    const { createCategory, updateCategory } = useCategoryApi()

    const handleUpdateValue = (value) => setDialog(prev => ({ ...prev, props: { ...prev.props, value: value }}))

    const handleClose = (type, operation, confirmed) => {
        if (confirmed) {
            if (type === 'project') {
                if (operation === 'add') {
                    createProject(dialog.props.value)
                } else if (operation === 'update') {
                    updateProject(selectedProject, dialog.props.value)
                }
            } else if (type === 'category') {
                if (operation === 'add') {
                    createCategory(selectedProject, dialog.props.value)
                } else if (operation === 'update') {
                    updateCategory(selectedProject, selectedCategoryId, dialog.props.value)
                }
            }
        }
        setDialog({type: "edit", props: {open: false}})
    }

    return (
        <Dialog
            open={ dialog.open }
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            onClose={ () => handleClose(dialog.props.type, 'cancel', false) }
        >
            <DialogTitle id="alert-dialog-title">{ dialog.props.title }</DialogTitle>
            <DialogContent>
                <TextField
                    id="edit-dialog"
                    autoFocus
                    margin="dense"
                    label="Name of project"
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={ dialog.props.value }
                    onChange={ (event) => handleUpdateValue(event.target.value) }
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={ () => handleClose(dialog.props.type, 'cancel', false) }>Cancel</Button>
                <Button onClick={ () => handleClose(dialog.props.type, dialog.props.operation, true) } autoFocus>Confirm</Button>
            </DialogActions>
        </Dialog>
    )
}

export default ComboValueEditorDialog
