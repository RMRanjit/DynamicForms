import React from "react";
import { Box, Link, Typography } from "@mui/material";

const Footer: React.FC = () => (
  <Box
    component="footer"
    sx={{ mt: "auto", py: 2, bgcolor: "background.paper" }}
  >
    <Typography variant="body2" color="text.secondary" align="center">
      <Link color="inherit" href="#">
        Privacy Policy
      </Link>
      {" | "}
      <Link color="inherit" href="#">
        Terms of Service
      </Link>
    </Typography>
  </Box>
);

export default Footer;
