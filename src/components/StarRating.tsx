import React from "react";
import { Rating, Typography } from "@mui/material";

interface StarRatingProps {
  value: number;
  onChange: (value: number | null) => void;
  max?: number;
}

const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  max = 5,
}) => {
  return (
    <div>
      <Typography component="legend">Rating</Typography>
      <Rating
        name="star-rating"
        value={value}
        onChange={(_, newValue) => {
          onChange(newValue);
        }}
        max={max}
      />
    </div>
  );
};

export default StarRating;
