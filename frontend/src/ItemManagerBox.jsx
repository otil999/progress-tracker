import { useRef } from "react"
import { Box, Divider, IconButton, Typography } from "@mui/material"
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew"
import ShuffleIcon from "@mui/icons-material/Shuffle"
import FileUploadIcon from "@mui/icons-material/FileUpload"
import { useAppContext, useItemApi } from "./AppContext.jsx"

export const ItemManagerBox = () => {
    const { setDialog } = useAppContext()
    const { fetchItems, randomNotPassedItem, importItems } = useItemApi()
    const itemsInputRef = useRef(null)

    const handleChange = (event) => {
        const file = event.target.files?.[0]
        if (file) {
            importItems(file)
            event.target.value = ""
            setDialog({open: true, type: 'import', props: {title: 'Importing category items'}})
        }
    }

    return (
        <Box textAlign='center' sx={{flexGrow: 1}}>
            <Typography variant="h6">ITEM</Typography>
            <Divider orientation='horizontal'/>
            <Box>
                <IconButton color='inherit' onClick={() => randomNotPassedItem()}>
                    <ShuffleIcon/>
                </IconButton>
                <IconButton color='inherit' onClick={() => fetchItems()}>
                    <PowerSettingsNewIcon/>
                </IconButton>
                <input
                    type="file"
                    ref={itemsInputRef}
                    style={{ display: "none" }}
                    onChange={(event) => handleChange(event)}
                />
                <IconButton color='inherit' onClick={() => itemsInputRef.current.click()}>
                    <FileUploadIcon/>
                </IconButton>
            </Box>
        </Box>
    )
}
