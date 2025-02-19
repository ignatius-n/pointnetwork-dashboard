import Box from '@mui/material/Box';
// Icons
import CloseIcon from '@mui/icons-material/Close';
import RemoveIcon from '@mui/icons-material/Remove';
import DomIds from '../../../@types/DOM-el-ids';

const TopBar = ({isLoading = true}: {isLoading: boolean}) => {
    const handeClose = () => {
        if (!isLoading) {
            window.Installer.closeWindow();
        }
    };

    return (
        <Box
            display="flex"
            justifyContent="flex-end"
            sx={{left: '2px', position: 'relative', top: '-2px'}}
        >
            <Box flex={1} sx={{'-webkit-app-region': 'drag'}}></Box>
            <Box
                sx={{
                    'opacity': 0.4,
                    'transition': 'all 150ms',
                    '&:hover': {opacity: 1},
                    '&:active': {opacity: 0.5}
                }}
            >
                <Box
                    id={DomIds.installer.topbar.minimizeButton}
                    px=".75rem"
                    py=".25rem"
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    bgcolor="primary.light"
                    sx={{cursor: 'pointer'}}
                    onClick={window.Installer.minimizeWindow}
                >
                    <RemoveIcon fontSize="small" />
                </Box>
            </Box>
            <Box
                sx={{
                    'opacity': 0.4,
                    'transition': 'all 150ms',
                    '&:hover': {opacity: 1},
                    '&:active': {opacity: 0.5}
                }}
            >
                <Box
                    id={DomIds.installer.topbar.closeButton}
                    px=".75rem"
                    py=".25rem"
                    bgcolor="red"
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    sx={{cursor: 'pointer'}}
                    onClick={handeClose}
                >
                    <CloseIcon fontSize="small" sx={{color: 'white'}} />
                </Box>
            </Box>
        </Box>
    );
};

export default TopBar;
