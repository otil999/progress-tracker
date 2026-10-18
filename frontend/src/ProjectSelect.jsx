import { useEffect } from "react"
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material"
import { useAppContext, useProjectApi, useCategoryApi } from "./AppContext.jsx"

export const ProjectSelect = () => {
    const formLabel = "Project"
    const { selectedProject, setSelectedProject, projectOptions, setItems } = useAppContext()
    const { fetchProjects } = useProjectApi()
    const { fetchCategories } = useCategoryApi()

    useEffect(() => fetchProjects(''), [])
    useEffect(() => {
        if (selectedProject) {
            fetchCategories(selectedProject)
            setItems([])
        }
    }, [selectedProject])

    return (
        <FormControl size="small" sx={{ flex: 0.3 }}>
            <InputLabel id="demo-simple-select-standard-label">{ formLabel }</InputLabel>
            <Select
                labelId="demo-select-small-label"
                variant="outlined"
                label={ formLabel }
                value={ selectedProject }
                onChange={ (event) => setSelectedProject(event.target.value) }
            >
                { projectOptions.map((item, idx) => (<MenuItem key={idx} value={item}>{item}</MenuItem>)) }
            </Select>
        </FormControl>
    )
}

export default ProjectSelect
