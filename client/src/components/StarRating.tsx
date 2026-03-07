import { useState } from "react";

type Props = {
  rating: number;
  onRatingChanged: (newRating: number) => void;
};

export const StarRating = ({ rating, onRatingChanged }: Props) => {
  const [currentRating, setCurrentRating] = useState<number>(rating);

  return (
    <span>
      {[...Array(5).keys()].map((currentKey) => (
        <svg
          key={currentKey + 1}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          style={{
            width: "40px",
            height: "40px",
            margin: "0 5px",
            cursor: "pointer",
            fill: "#ccc",
            transition: "fill 0.2s ease-in-out",
            ...(currentKey + 1 <= currentRating && {
              fill: "#FFD700",
            }),
          }}
          onMouseEnter={() => setCurrentRating(currentKey + 1)}
          onMouseLeave={() => setCurrentRating(rating)}
          onClick={() => {
            setCurrentRating(currentKey + 1);
            onRatingChanged(currentKey + 1);
          }}
        >
          <path d="M12 .587l3.668 7.568L24 9.423l-6 5.865L19.335 24 12 19.854 4.665 24 6 15.288 0 9.423l8.332-1.268z" />
        </svg>
      ))}
    </span>
  );
};
