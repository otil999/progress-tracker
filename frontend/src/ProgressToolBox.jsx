import { Box, LinearProgress, Typography } from '@mui/material'
import { useAppContext } from './AppContext.jsx'

export const ProgressToolBox = () => {
    const { progress } = useAppContext()

    return (
        <Box>
            <Typography variant='h5'>Progress Tracker</Typography>
            <Box sx={{ gap: 1, display: 'flex', width: '100%', alignItems: 'center' }}>
                <Typography nvariant='h6'>{ progress }%</Typography>
                <LinearProgress
                    variant="determinate"
                    value={ progress }
                    sx={{
                        width: '100%',
                        height: 15,
                        borderRadius: 1,
                        // Filled bar color
                        "& .MuiLinearProgress-bar": {
                            backgroundColor: "background.paper",
                            borderRadius: 1,
                        },
                    }}
                />
            </Box>
        </Box>
    )
}

export default ProgressToolBox
