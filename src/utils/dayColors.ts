/**
 * Get color for a day based on day number
 * Returns consistent colors for each day
 */
export function getDayColor(dayNumber: number): string {
  const colors = [
    '#0f62fe', // Blue - Day 1
    '#24a148', // Green - Day 2
    '#ff832b', // Orange - Day 3
    '#8a3ffc', // Purple - Day 4
    '#da1e28', // Red - Day 5
    '#0072c3', // Dark blue - Day 6
    '#007d79', // Teal - Day 7
    '#6f6f6f', // Gray - Day 8
    '#ffab00', // Yellow - Day 9
    '#161616', // Dark gray - Day 10
  ];

  // Use modulo to cycle through colors if more than 10 days
  return colors[(dayNumber - 1) % colors.length];
}
