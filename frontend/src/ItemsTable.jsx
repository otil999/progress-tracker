import { useEffect, useState } from "react"
import {
    Box,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableFooter,
    TableHead,
    TableRow,
    TablePagination,
    Toolbar,
    Tooltip,
    Typography
} from "@mui/material"
import { alpha } from "@mui/material/styles"
import DeleteIcon from "@mui/icons-material/Delete"
import { ItemsTableHeader } from "./ItemsTableHeader.jsx"
import { ItemsTableNewRow } from "./ItemsTableNewRow.jsx"
import { ItemsTableRows } from "./ItemsTableRows.jsx"
import { useAppContext, useItemApi } from "./AppContext.jsx"

export const ItemsTable = () => {
    const { selectedCategoryId, totalCount, page, setPage, rowsPerPage, setRowsPerPage, search } = useAppContext()
    const { fetchItems, searchItems } = useItemApi()
    const [selected, setSelected] = useState([])

    const handleRowsPerPageChange = (value) => {
        setRowsPerPage(value)
        setPage(0)
    }

    useEffect(() => {
        if (selectedCategoryId) {
            if (search === '') {
                fetchItems()
            } else {
                searchItems()
            }
        }
    }, [page, rowsPerPage])

    let numSelected = 1

    return (
        selectedCategoryId &&
        <Box sx={{ flex: 1, width: '100%', justifyContent: 'center' }}>
            <Paper sx={{ width: '100%', mx: 'auto', marginTop: 1 }}>
                <Toolbar
                    sx={[
                        {
                            pl: { sm: 2 },
                            pr: { xs: 1, sm: 1 },
                        },
                        numSelected > 0 && {
                            bgcolor: (theme) =>
                                alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
                        },
                    ]}
                >
                    {numSelected > 0 ? (
                        <Typography
                            sx={{ flex: '1 1 100%' }}
                            color="inherit"
                            variant="subtitle1"
                            component="div"
                        >
                            {numSelected} selected item(s)
                        </Typography>
                    ) : (
                        <Typography
                            sx={{ flex: '1 1 100%' }}
                            variant="h6"
                            id="tableTitle"
                            component="div"
                        >
                            Nutrition
                        </Typography>
                    )}
                    {numSelected > 0 ? (
                        <Tooltip title="Delete">
                            <IconButton>
                                <DeleteIcon />
                            </IconButton>
                        </Tooltip>
                    ) : (
                        <Tooltip title="Filter list">
                            <IconButton>
                                <FilterListIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                </Toolbar>
                <Table size="medium">
                    <TableHead>
                        <ItemsTableHeader selected={ selected } setSelected={ setSelected } />
                        <ItemsTableNewRow/>
                    </TableHead>
                    <TableBody>
                        <ItemsTableRows page={ page } rowsPerPage={ rowsPerPage }/>
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TablePagination
                                rowsPerPageOptions={ [5, 10, 25, 50, 100] }
                                count={ totalCount }
                                rowsPerPage={ rowsPerPage }
                                page={ page }
                                onPageChange={ (event, newPage) => setPage(newPage) }
                                onRowsPerPageChange={ (event) => handleRowsPerPageChange(Number(event.target.value)) }
                            />
                        </TableRow>
                    </TableFooter>
                </Table>
            </Paper>
        </Box>
    )
}
