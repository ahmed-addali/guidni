import type { SVGProps } from "react";

interface GuidniIconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

export function GuidniIcon({ size = 24, className, ...props }: GuidniIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 160 160"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      {...props}
    >
      <g transform="translate(0,160) scale(0.1,-0.1)">
        <path d="M650 1534 c-102 -27 -180 -73 -266 -159 -125 -124 -179 -253 -178 -430 1 -224 120 -456 355 -695 52 -53 127 -122 167 -154 l72 -58 28 18 c15 10 83 74 152 143 262 263 399 497 425 721 5 46 2 63 -17 100 -41 79 -61 85 -294 85 -148 0 -207 -4 -226 -13 -58 -31 -77 -125 -36 -177 34 -44 75 -55 198 -55 124 0 125 -1 89 -72 -29 -56 -99 -122 -167 -155 -50 -24 -69 -28 -147 -28 -78 0 -97 4 -147 28 -76 37 -143 104 -176 175 -23 49 -27 70 -27 147 1 77 5 98 28 145 47 97 128 166 231 196 76 21 151 15 241 -21 77 -31 115 -34 151 -11 57 38 75 122 37 174 -25 34 -109 77 -188 97 -74 19 -232 18 -305 -1z" />
      </g>
    </svg>
  );
}
