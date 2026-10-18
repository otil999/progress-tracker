import { IconButton, InputAdornment, TextField } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import {useAppContext, useItemApi} from './AppContext.jsx'

export const SearchField = () => {
    const {search, setSearch} = useAppContext()
    const {searchItems} = useItemApi()

    const handleChange = (value) => {
        setSearch(prev => prev !== value ? value : prev)
    }

    return (
        <TextField
            onChange={ (event) => handleChange(event.target.value) }
            sx={{ flex: 0.4 }}
            size="small"
            placeholder="Search..."
            slotProps={{
                input: {
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                edge="end"
                                onClick={ () => searchItems(search) }
                            >
                                <SearchIcon />
                            </IconButton>
                        </InputAdornment>
                    )
                }
            }}
            value={ search }
        />
    )
}
