import { useEffect } from "react";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material"
import { useAppContext, useItemApi } from "./AppContext.jsx"

export const CategorySelect = () => {
    const formLabel = "Category"
    const { categoryOptions, selectedCategoryId, setSelectedCategoryId, setPage } = useAppContext()
    const { fetchItems } = useItemApi()

    const handleChange = (value) => {
        setSelectedCategoryId(value)
        setPage(0)
    }

    useEffect(() => {
        selectedCategoryId && fetchItems()
    }, [selectedCategoryId]);

    return (
        <FormControl size="small" sx={{ flex: 0.3 }}>
            <InputLabel id="demo-simple-select-standard-label">{ formLabel }</InputLabel>
            <Select
                labelId="demo-select-small-label"
                variant="outlined"
                label={ formLabel }
                value={ selectedCategoryId }
                onChange={ (event) => setSelectedCategoryId(Number(event.target.value)) }
            >
                { categoryOptions.map((item) => (<MenuItem key={ item.id } value={ item.id }>{ item.name }</MenuItem>)) }
            </Select>
        </FormControl>
    )
}

export default CategorySelect
