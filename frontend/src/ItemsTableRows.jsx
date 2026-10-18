import { Checkbox, TableCell, TableRow, TextField } from "@mui/material"
import IconButton from "@mui/material/IconButton"
import SaveIcon from "@mui/icons-material/Save"
import DeleteIcon from "@mui/icons-material/Delete"
import { useAppContext, useItemApi } from "./AppContext.jsx"

export const ItemsTableRows = () => {
    const { items, setItems } = useAppContext()
    const { deleteItem, updateItem } = useItemApi()

    const handleUpdateProperty = (id, field, value) => {
        setItems(prev => prev.map(r => r.id === id ? {...r, [field]: value} : r))
    }

    return items.map(item => (
        <TableRow hover key={ item.id } sx={{ cursor: 'pointer' }}>
            <TableCell padding="checkbox">
                <Checkbox
                    color="primary"
                    // checked={ selected.includes(item.id) }
                    // onChange={ () => onSelectionChange(item.id) }
                />
            </TableCell>
            <TableCell padding="checkbox">
                <TextField
                    value={ item.name }
                    size="small"
                    variant="filled"
                    fullWidth
                    onChange={ (event) => handleUpdateProperty(item.id, 'name', event.target.value) }
                    sx={{ m: 0, p: 0, '& .MuiInputBase-input': {
                            py: 0.5 // vertical padding
                        }}}
                />
            </TableCell>
            <TableCell padding="checkbox">
                <TextField
                    value={ item.type }
                    size="small"
                    variant="filled"
                    fullWidth
                    onChange={ (event) => handleUpdateProperty(item.id, 'type', event.target.value) }
                    sx={{ m: 0, p: 0, '& .MuiInputBase-input': {
                            py: 0.5 // vertical padding
                        }}}
                />
            </TableCell>
            <TableCell padding="checkbox">
                <TextField
                    value={ item.description }
                    size="small"
                    variant="filled"
                    fullWidth
                    onChange={ (event) => handleUpdateProperty(item.id, 'description', event.target.value) }
                    sx={{m:0, p:0, '& .MuiInputBase-input': {
                            py: 0.5,   // vertical padding
                        }}}
                />
            </TableCell>
            <TableCell padding="checkbox">
                <Checkbox
                    color="primary"
                    checked={ item.passed }
                    onClick={ () => handleUpdateProperty(item.id, 'passed', !item.passed) }
                />
            </TableCell>
            <TableCell padding="checkbox" sx={{ whiteSpace: 'nowrap' }}>
                <IconButton onClick={ () => updateItem(item) }>
                    <SaveIcon/>
                </IconButton>
                <IconButton onClick={ () => deleteItem(item.id) }>
                    <DeleteIcon />
                </IconButton>
            </TableCell>
        </TableRow>
    ))
}
