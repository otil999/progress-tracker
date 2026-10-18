import { useMemo } from 'react'
import { Box, Divider, IconButton, Typography } from '@mui/material'
import LibraryAddIcon from '@mui/icons-material/LibraryAdd'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import RestartAltIcon from "@mui/icons-material/RestartAlt"
import { useAppContext, useCategoryApi } from './AppContext.jsx'

export const CategoryManagerBox = () => {
    const { selectedProject, categoryOptions, selectedCategoryId, setDialog } = useAppContext()
    const { deleteCategory, resetCategory } = useCategoryApi()

    const selectedCategoryName = useMemo(() => {
        selectedCategoryId !== ''
            ? categoryOptions.find(option => option.id === selectedCategoryId).name
            : ''
    }, [selectedCategoryId])

    const handleResetCategory = () => {
        resetCategory(selectedProject, selectedCategoryId)
    }

    return (
        <Box textAlign='center' sx={{mr: 1, flexGrow: 1}}>
            <Typography variant="h6">CATEGORY</Typography>
            <Divider orientation='horizontal' sx={{color: "primary"}}/>
            <Box>
                <IconButton color='inherit'>
                    <LibraryAddIcon onClick={() => setDialog({
                        open: true,
                        type: 'edit',
                        props: {
                            value: 'Category',
                            title: 'Add category',
                            type: 'category',
                            operation: 'add'
                        }
                    })}/>
                </IconButton>
                <IconButton color='inherit'>
                    <EditIcon onClick={() => setDialog({
                        open: true,
                        type: 'edit',
                        props: {
                            value: selectedCategoryName,
                            title: 'Edit category',
                            type: 'category',
                            operation: 'update'
                        }
                    })}/>
                </IconButton>
                <IconButton
                    color='inherit'
                    onClick={() => setDialog({
                        open: true,
                        type: 'confirm',
                        props: {
                            title: 'Confirm',
                            description: `Are you sure to delete the whole category ${selectedCategoryName}?`,
                            handleConfirm: () => deleteCategory(selectedProject, selectedCategoryId)
                        }
                    })}
                >
                    <DeleteIcon/>
                </IconButton>
                <IconButton
                    color='inherit'
                    onClick={() => handleResetCategory()}
                >
                    <RestartAltIcon/>
                </IconButton>
            </Box>
        </Box>
    )
}
