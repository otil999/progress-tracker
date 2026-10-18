import { useState } from "react"
import { useItemApi } from "./AppContext.jsx"
import { Checkbox, IconButton, TableRow, TableCell, TextField } from '@mui/material'
import LibraryAddIcon from '@mui/icons-material/LibraryAdd'

export const ItemsTableNewRow = () => {
    const { createItem } = useItemApi()

    const emptyItem = {
        name: '',
        type: '',
        description: '',
        passed: false
    }

    const [newItem, setNewItem] = useState(emptyItem)

    const handleUpdateItem = (field, value) => {
        setNewItem(prevState => ({...prevState, [field]: value}))
    }

    const handleCreateItem = () => {
        createItem(newItem)
        setNewItem(emptyItem)
    }

    return (
        <TableRow hover key={0} sx={{ cursor: 'pointer' }}>
            <TableCell padding="checkbox"/>
            <TableCell padding="checkbox">
                <TextField
                    fullWidth
                    value={newItem.name}
                    size="small"
                    variant="filled"
                    onChange={ (event) => handleUpdateItem('name', event.target.value) }
                    sx={{
                        m: 0, p: 0, '& .MuiInputBase-input': {
                            py: 0.5 // vertical padding
                        }
                    }}
                />
            </TableCell>
            <TableCell padding="checkbox">
                <TextField
                    fullWidth
                    value={newItem.type}
                    onChange={ (event) => handleUpdateItem('type', event.target.value) }
                    size="small"
                    variant="filled"
                    sx={{
                        m: 0, p: 0, width: 1, '& .MuiInputBase-input': {
                            py: 0.5 // vertical padding
                        }
                    }}
                />
            </TableCell>
            <TableCell padding="checkbox">
                <TextField
                    fullWidth
                    value={newItem.description}
                    onChange={ (event) => handleUpdateItem('description', event.target.value) }
                    size="small"
                    variant="filled"
                    sx={{
                        m: 0, p: 0, width: 1, '& .MuiInputBase-input': {
                            py: 0.5 // vertical padding
                        }
                    }}
                />
            </TableCell>
            <TableCell padding="checkbox">
                <Checkbox
                    color="primary"
                    checked={ newItem.passed }
                    onChange={ () => handleUpdateItem('passed', !newItem.passed) }
                />
            </TableCell>
            <TableCell padding="checkbox">
                <IconButton onClick={ () => handleCreateItem() }>
                    <LibraryAddIcon/>
                </IconButton>
            </TableCell>
        </TableRow>
    )
}

export default ItemsTableNewRow
