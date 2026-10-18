import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material"
import { useAppContext } from "./AppContext.jsx"

export const ConfirmDialog = () => {
    const { dialog, setDialog } = useAppContext()

    const handleClose = () => {
        setDialog(prev => ({ ...prev, open: false }))
    }

    const handleConfirm = () => {
        handleClose()
        dialog.props.handleConfirm()
    }

    return (
         <Dialog open={ dialog.open } onClose={ () => handleClose() }>
             <DialogTitle>{ dialog.props.title ?? "Are you sure?" }</DialogTitle>
             <DialogContent>
                 <DialogContentText>
                     { dialog.props.description ?? "This action cannot be undone." }
                 </DialogContentText>
             </DialogContent>
             <DialogActions>
                 <Button onClick={ () => handleClose() }>Cancel</Button>
                 <Button onClick={ () => handleConfirm() } color="error" variant="contained">Confirm</Button>
             </DialogActions>
         </Dialog>
    )
}

export default ConfirmDialog
