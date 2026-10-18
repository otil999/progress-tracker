import * as React from 'react';
import { styled, alpha } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputBase from '@mui/material/InputBase';
import MenuIcon from '@mui/icons-material/Menu';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';
import LibraryAddIcon from '@mui/icons-material/LibraryAdd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import {
    Alert,
    Checkbox,
    Container,
    Divider,
    FormControl, FormHelperText, Input,
    InputAdornment,
    InputLabel, LinearProgress,
    Paper,
    Select,
    Tab, Table, TableBody, TableCell, TableFooter, TableHead, TablePagination, TableRow, TableSortLabel,
    TextField, Tooltip
} from "@mui/material";

import AppBarDivider from "./AppBarDivider.jsx";
import {ProjectSelect} from "./ProjectSelect.jsx";
import CategorySelect from "./CategorySelect.jsx";
import {useEffect, useMemo, useState} from "react";
import {visuallyHidden} from "@mui/utils";
import ItemsTableHeader from "./ItemsTableHeader.jsx"
import ComboValueEditorDialog from "./ComboValueEditorDialog.jsx";
import { ConfirmDialog } from "./ConfirmDialog.jsx"
import { useAppContext, useDialog } from "./AppContext.jsx"
import { fetchApi } from "./utils.js"
import { ItemsTable } from "./ItemsTable.jsx"
import { ProgressToolBox } from "./ProgressToolBox.jsx"
import { ProjectManagerBox } from "./ProjectManagerBox.jsx"
import { CategoryManagerBox } from "./CategoryManagerBox.jsx"
import { ItemManagerBox } from "./ItemManagerBox.jsx"
import { AppSnackbar } from "./AppSnackbar.jsx"
import { SearchField } from "./SearchField.jsx"

const Search = styled('div')(({ theme }) => ({
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    '&:hover': {
        backgroundColor: alpha(theme.palette.common.white, 0.25),
    },
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
        marginLeft: theme.spacing(1),
        width: 'auto',
    },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: 'inherit',
    width: '100%',
    '& .MuiInputBase-input': {
        padding: theme.spacing(1, 1, 1, 0),
        // vertical padding + font size from searchIcon
        paddingLeft: `calc(1em + ${theme.spacing(4)})`,
        transition: theme.transitions.create('width'),
        [theme.breakpoints.up('sm')]: {
            width: '12ch',
            '&:focus': {
                width: '20ch',
            },
        },
    },
}));

export const SearchAppBar = () => {
    const {
        selectedProject,
        setSelectedProject,
        projectOptions,
        setProjectOptions,
        selectedCategoryId,
        setCategoryOptions,
        ordering,
        itemAdded,
        editDialog,
        setEditDialog,
        confirm,
        setConfirm,
        progress,
        items,
        importProgress,
        dialog,
        setDialog
    } = useAppContext()

    const { renderDialog } = useDialog()

    // const [anchorElNav, setAnchorElNav] = React.useState(null);
    // const [anchorElUser, setAnchorElUser] = React.useState(null);
    //
    // const handleOpenNavMenu = (event) => {
    //     setAnchorElNav(event.currentTarget);
    // };
    // const handleOpenUserMenu = (event) => {
    //     setAnchorElUser(event.currentTarget);
    // };
    //
    // const handleCloseNavMenu = () => {
    //     setAnchorElNav(null);
    // };
    //
    // const handleCloseUserMenu = () => {
    //     setAnchorElUser(null);
    // };
    //

    // const [dense, setDense] = React.useState(false);
    //
    // const emptyRows =
    //     page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

    // const [sortedRows, setSortedRows] = useState(rows);

    function handleSelectionChange(rowId) {
        setSelected((prev) => prev.includes(rowId)
            ? selected.filter(item => item !== rowId)
            : [...prev, rowId]
        )
    }

    useEffect(() => {
        if (!localStorage.getItem("authToken"))  {
            setDialog({ type: 'login', open: true })
        }
    }, [])

    return (
        <>
            {renderDialog(dialog)}
            {localStorage.getItem("authToken") && (
                <>
                    <AppSnackbar/>
                    <AppBar position="static">
                        <Toolbar>
                            <ProgressToolBox/>
                            <AppBarDivider/>
                            <ProjectManagerBox/>
                            <CategoryManagerBox/>
                            <ItemManagerBox/>
                            <AppBarDivider />
                            <Box
                                sx={{
                                    width: '40%',
                                    display: 'flex',
                                    gap: 1,
                                    bgcolor: "background.paper",
                                    px: 1.5,
                                    py: 0.7,
                                    borderRadius: 1,
                                    alignItems: 'center'
                                }}
                            >
                                <ProjectSelect/>
                                <CategorySelect/>
                                <SearchField/>
                            </Box>
                        </Toolbar>
                    </AppBar>
                    <ItemsTable/>
                </>
            )}
        </>
    )
}
