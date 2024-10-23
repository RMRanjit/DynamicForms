import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { visuallyHidden } from "@mui/utils";

const Header: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const menuItems = [
    { text: "Home", current: true },
    { text: "About", current: false },
    { text: "Contact", current: false },
    { text: "Sign In", current: false },
  ];

  const renderMenuItems = () =>
    menuItems.map((item) => (
      <Button
        key={item.text}
        color="inherit"
        aria-current={item.current ? "page" : undefined}
      >
        {item.text}
      </Button>
    ));

  const renderMobileMenu = () => (
    <>
      <IconButton
        edge="start"
        color="inherit"
        aria-label="menu"
        onClick={() => setDrawerOpen(true)}
      >
        <MenuIcon />
      </IconButton>
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton onClick={() => setDrawerOpen(false)}>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
    </>
  );

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h1"
          component="h1"
          sx={{ fontSize: "1.25rem", flexGrow: 1 }}
        >
          State Medicaid Application
        </Typography>
        {isMobile ? (
          renderMobileMenu()
        ) : (
          <Box component="nav" aria-label="Main navigation">
            {renderMenuItems()}
          </Box>
        )}
        <Box component="span" sx={visuallyHidden}>
          End of main navigation
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
