import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

interface ProgressCircleProps {
  radius: number;
  strokeWidth: number;
  current: number;      // calories eaten
  target: number;       // maintenance calories
  color?: string;
}

export default function ProgressCircle({
  radius,
  strokeWidth,
  current,
  target,
  color = '#4CAF50',
}: ProgressCircleProps) {
  const [circumference, setCircumference] = useState(0);

  useEffect(() => {
    setCircumference(2 * Math.PI * (radius - strokeWidth / 2));
  }, [radius, strokeWidth]);

  const progress =
    target > 0 ? Math.min(current / target, 1) : 0;

  const strokeDashoffset =
    circumference * (1 - progress);

  return (
    <View style={{ width: radius * 2, height: radius * 2 }}>
      <Svg width={radius * 2} height={radius * 2}>
        {/* Background circle */}
        <Circle
          stroke="#e0e0e0"
          fill="transparent"
          strokeWidth={strokeWidth}
          cx={radius}
          cy={radius}
          r={radius - strokeWidth / 2}
        />

        {/* Progress circle */}
        <Circle
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          cx={radius}
          cy={radius}
          r={radius - strokeWidth / 2}
          rotation="-90"
          origin={`${radius}, ${radius}`}
        />

        {/* Center text */}
        <SvgText
          x="35%"
          y="45%"
          textAnchor="start"
          alignmentBaseline="middle"
          fontSize={radius / 4}
          fill="#ffffffff"
          fontWeight="bold"
        >
          {Math.round(progress * 100)}%
        </SvgText>

        <SvgText
          x="33%"
          y="60%"
          textAnchor="middle"
          alignmentBaseline="middle"
          fontSize={radius / 5}
          fill="#cacacaff"
        >
          {current} /   {Math.round(target)}
        </SvgText>
      </Svg>
    </View>
  );
}
