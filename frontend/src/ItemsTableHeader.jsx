import { Checkbox, TableCell, TableRow, TableSortLabel } from "@mui/material"
import { useAppContext, useItemApi } from "./AppContext.jsx"
import { useEffect } from "react";

export const ItemsTableHeader = ({ selected, setSelected }) => {
    const { items, ordering, setOrdering } = useAppContext()
    const { fetchItems } = useItemApi()

    const headCells = [
        {
            id: 'name',
            label: 'Name',
            width: 0.2
        },
        {
            id: 'type',
            label: 'Type',
            width: 0.2
        },
        {
            id: 'description',
            label: 'Description',
            width: 0.4
        },
        {
            id: 'passed',
            label: 'Done'
        }
    ]

    // const descendingComparator = (a, b, orderBy) => {
    //     if (b[orderBy] < a[orderBy]) {
    //         return -1
    //     }
    //     if (b[orderBy] > a[orderBy]) {
    //         return 1
    //     }
    //     return 0
    // }

    // const getComparator = (column, direction) => {
    //     return direction === 'desc'
    //         ? (a, b) => descendingComparator(a, b, column)
    //         : (a, b) => -descendingComparator(a, b, column)
    // }

    const onTableSortLabelClick = (headCell) => {
        setOrdering(prevState => ({
            column: headCell.id,
            direction: prevState.column === headCell.id && prevState.direction === 'asc' ? 'desc' : 'asc'
        }))
    }

    const handleSelectAll = () => {
        setSelected(selected.length > 0 ? [] : items.map(item => item.id))
    }

    useEffect(() => {
        fetchItems()
    }, [ordering])

    return (
        <TableRow>
            <TableCell padding="checkbox">
                <Checkbox
                    color="primary"
                    indeterminate={ selected.length > 0 && selected.length < items.length }
                    checked={ selected.length > 0 && selected.length === items.length }
                    onChange={ () => handleSelectAll() }
                />
            </TableCell>
            { headCells.map(headCell => (
                <TableCell
                    key={ headCell.id }
                    align='left'
                    padding='checkbox'
                    sx={{ width: headCell.width }}
                >
                    <TableSortLabel
                        active={ ordering.column === headCell.id }
                        direction={ ordering.column === headCell.id ? ordering.direction : 'asc' }
                        onClick={ () => onTableSortLabelClick(headCell) }
                    >
                        { headCell.label }
                    </TableSortLabel>
                </TableCell>
            )) }
            <TableCell padding="checkbox">Action</TableCell>
        </TableRow>
    )
}

export default ItemsTableHeader
