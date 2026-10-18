import { useRef } from "react"
import { Box, Divider, IconButton, Typography } from '@mui/material'
import LibraryAddIcon from '@mui/icons-material/LibraryAdd'
import EditIcon from '@mui/icons-material/Edit'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import DeleteIcon from '@mui/icons-material/Delete'
import { useAppContext, useProjectApi } from './AppContext.jsx'

export const ProjectManagerBox = () => {
    const { setDialog, selectedProject } = useAppContext()
    const { uploadProjectFile, deleteProject } = useProjectApi()
    const fileInputRef = useRef();

    return (
        <Box textAlign='center' sx={{marginRight: 1, flexGrow: 1}}>
            <Typography variant="h6">PROJECT</Typography>
            <Divider orientation='horizontal'/>
            <Box>
                <IconButton
                    color='inherit'
                    onClick={() => setDialog({type: "edit", open: true, props: {value: "Project", title: "Add Project", type: "project", operation: "add"}})}
                >
                    <LibraryAddIcon/>
                </IconButton>
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={(event) => uploadProjectFile(event.target.files[0])}
                />
                <IconButton
                    color='inherit'
                    onClick={() => fileInputRef.current.click()}
                >
                    <FileUploadIcon/>
                </IconButton>
                <IconButton color='inherit'>
                    <EditIcon onClick={() => setDialog({type: "edit", open: true, props: {value: selectedProject, title: 'Edit project', type: 'project', operation: 'update'}})}/>
                </IconButton>
                <IconButton
                    color='inherit'
                    onClick={() => setDialog({
                        open: true,
                        type: 'confirm',
                        props: {
                            title: 'Confirm',
                            description: `Are you sure to delete the whole project '${selectedProject}'?`,
                            handleConfirm: () => deleteProject(selectedProject)
                        }
                    })}
                >
                    <DeleteIcon/>
                </IconButton>
            </Box>
        </Box>
    )
}

export default ProjectManagerBox
