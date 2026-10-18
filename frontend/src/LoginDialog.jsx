import {useState} from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import {useAppContext} from "./AppContext.jsx";

export default function LoginDialog() {
    const { dialog, setDialog } = useAppContext()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')

    const handleLogin = () => {
        if (username === 'admin' && password === '331LVaOIChti') {
            const token = btoa(`${username}:${Date.now()}`);
            localStorage.setItem("authToken", token);
            setDialog(prev => ({...prev, open: false}))
        }
    }

    return (
        <Dialog open={dialog.open} maxWidth="xs" fullWidth>
            <DialogTitle>Login</DialogTitle>
            <DialogContent>
                <Box
                    component="form"
                    sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleLogin();
                    }}
                >
                    <TextField
                        label="Username"
                        variant="outlined"
                        fullWidth
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />

                    <TextField
                        label="Password"
                        type="password"
                        variant="outlined"
                        fullWidth
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleLogin} variant="contained" type="submit">
                    Login
                </Button>
            </DialogActions>
        </Dialog>
    )
}
