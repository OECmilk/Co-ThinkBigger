"use client";

import { cn } from "@/lib/utils";
import React from "react";

type DesireType = 'self' | 'target' | 'third-party';

interface TriangleChartProps {
  onSelect: (type: DesireType) => void;
  selectedType: DesireType | null;
  counts: Record<DesireType, number>;
}

export function TriangleChart({ onSelect, selectedType, counts }: TriangleChartProps) {
  // We use CSS clip-path to create the triangle sections.
  // The structure is a big triangle split into 3.
  // Actually, standard implementation of "Think Bigger Triangle" is often Y-split or 3 sub-triangles.
  // Based on the user image: Top Triangle (inverted?), Left Bottom, Right Bottom.
  // Wait, the image shows:
  // Top Center: "あなた" (Inverted Triangle shape mostly or Trapezoid?)
  // Actually it looks like 3 trapeoids or triangles meeting at center.
  // Let's approximate with 3 polygons forming a big triangle.

  return (
    <div className="relative w-[300px] h-[260px] md:w-[400px] md:h-[346px] mx-auto filter drop-shadow-xl my-8">
      {/* Top Section (You/Self) - Inverted Triangle positioned at top? 
          Actually standard Think Bigger map is:
          Top: You
          Left: Target
          Right: Third Party
      */}

      {/* Top Triangle (Self) */}
      <div
        onClick={() => onSelect('self')}
        className={cn(
          "absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-stone-700 hover:bg-[#f97316] transition-colors cursor-pointer flex flex-col items-center justify-center text-white pt-4 z-10",
          // Clip path for inverted triangle at top part of the big triangle?
          // No, let's look at the image again. It's a big triangle divided into 3.
          // Top part is a triangle pointing up? No, the user image shows Top part is "Inverted"? No.
          // The user image shows a big triangle.
          // Detailed look at user image:
          // It is a big triangle pointing UP.
          // Inside, it is divided into 3 smaller triangles?
          // Top part is a smaller triangle pointing UP. (You)
          // Left part is a polygon (Trapezoid?) (Target)
          // Right part is a polygon (Trapezoid?) (Third Party)
          // WAIT. The image shows:
          // Top Triangle (Dark Grey): "あなた"
          // Left Bottom (Grey): "ターゲット"
          // Right Bottom (Grey): "第三者"
          // All 3 meet at the center. 
          // So it is 3 triangles meeting at the center?
          // Top one is base-up? No, standard layout is:
          //       / \
          //      / A \
          //     /_____\
          //    / B \ C \
          //   /_____\___\

          // Based on User Image:
          // It looks like a Triforce but filled?
          // Or just split into three sectors from centroid.
        )}
        style={{
          clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)", // Basic Triangle
          // This is too hard to perfectly match simply.
          // Let's use 3 div approach with explicit clip-paths for sectors.
        }}
      >
      </div>
    </div>
  );
}

// Re-implementing with simpler SVG approach for better control
export function TriangleSVG({ onSelect, selectedType, counts }: TriangleChartProps) {
  const width = 400;
  const height = 346; // h = w * sin(60)
  const cx = width / 2;
  const cy = height * 2 / 3; // Centroid of equilateral triangle is lower
  // Actually, let's split from center (cx, cy) to vertices.
  // Vertices: Top(200, 0), BottomRight(400, 346), BottomLeft(0, 346)

  // Center of the triangle is at (200, 230.6) approx? 
  // h = 346. 1/3 h from bottom = 115.  y = 346 - 115 = 231.
  const center = { x: 200, y: 230 };

  // Sector You (Top): Center -> BottomLeft -> Top -> BottomRight? No.
  // Sector You (Top): Vertices: Top(200,0), Center(200,230), ...
  // Wait, standard 3-split is sectors.

  // User Image Interpretation:
  // Top Section "あなた": Triangle at the top. 
  // Actually, the image shows an INVERTED Y split.
  // Center point. Line to top vertex? No.
  // It looks like the "Triangle" is composed of 3 smaller triangles meeting at a point.
  // One triangle is Top, one is Bottom Left, one is Bottom Right.
  // Top Triangle: p1(0,0), p2(400,0), p3(200, 200) ?? No that's a square.

  // Let's assume it consists of 3 smaller triangles that form a larger one.
  // No, that makes a hole in the middle if they are all point up.
  // Truncated Pyramid?

  // Let's go with visual approximation of the image provided.
  // Image: Big Triangle.
  // Top part: "あなた". It is a smaller triangle at the top? 
  // Or is it a trapezoid?
  // Actually, usually "Think Bigger" map is:
  // Top: You.  Left: Target. Right: Third Party.

  const selectedClass = "fill-[#f97316] stroke-white stroke-2";
  const defaultClass = "fill-stone-600 hover:fill-stone-500 transition-colors cursor-pointer stroke-white stroke-2";
  const activeClass = "fill-orange-500 scale-105"; // SVG transform needed for scale

  return (
    <svg width="100%" height="100%" viewBox="0 0 400 350" className="drop-shadow-xl overflow-visible">
      <defs>
        <filter id="shadow">
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Top Triangle (You) - Actually the image shows it occupying the top area */}
      {/* Vertices: Top(200,0), LeftMid(100, 173), RightMid(300, 173), Center(200, 230)? */}
      {/* Simpler split: Center(200, 230) to Vertices(200,0), (0,346), (400,346) ? */}
      {/* That would make 3 sectors. 
          Top Sector: (0,0)? No.
          Let's try defined paths.
      */}

      {/* Top Diamond/Kite shape? 
          Let's use the center point (200, 200) for visual balance.
          Top Vertex: (200, 0)
          Left Vertex: (0, 346)
          Right Vertex: (400, 346)
          
          Split point: (200, 210)
      */}

      {/* Region 1: You (Top) */}
      {/* Path: Top -> Split -> RightMid(300, 173) ?? 
          Let's just use 3 Triangles that touch.
          Top Triangle: (200,0), (100, 173), (300, 173).  This is the top half. "あなた".
          Left Bottom: (100, 173), (0, 346), (200, 346).
          Right Bottom: (300, 173), (200, 346), (400, 346).
          Center is empty? No, (100,173)-(300,173)-(200,346) is a middle inverted triangle.
          This is the "Triforce" pattern.
          
          Is the user image a Triforce?
          LOOKING AT IMAGE:
          It is solid.
          Top part is a triangle.
          Bottom Left is a triangle.
          Bottom Right is a triangle.
          They meet at a central point.
          So it IS 3 triangles meeting at a point?
          But to form a big triangle, the meeting point must be the centroid? 
          No, if 3 triangles meet at a point, their bases form the perimeter?
          Yes. Center -> Vertex 1, Center -> Vertex 2, Center -> Vertex 3.
          This divides the big triangle into 3 obtuse triangles.
          
          Let's try that.
          Center: (200, 230)
          Top Vertex: (200, 0)
          Left Bottom: (0, 346)
          Right Bottom: (400, 346)
          
          Sector 1 (Right): Center -> Top -> Right -> Center.
          Sector 2 (Bottom): Center -> Right -> Left -> Center.
          Sector 3 (Left): Center -> Left -> Top -> Center.
          
          This splits it into 3 equal areas if Center is Centroid.
          
          However, the Image labels "You" at top. "Target" at Left. "Third Party" at right.
          So:
          Sector 1 (Top?): Maybe we rotate the split lines?
          Let's splitting lines be midpoints of sides?
          MidLeft(100, 173), MidRight(300, 173), BottomMid(200, 346).
          Connect Center(200, 230) to these midpoints?
          
          Area 1 (Top): Top(200,0) -> MidRight -> Center -> MidLeft -> Top. (Diamond)
          Area 2 (Left): ...
          
      */}

      {/* Let's go with the Triforce Layout (4 small triangles, center one inverted) but use center one as junction or merge it?
          User image: It looks like [Top Triangle] sits on [Two Bottom Triangles].
          The split lines form a 'Y' shape inverted.
          
          Let's do:
          Top Triangle (You): (200, 0) -> (0, 346) -> (400, 346) ... Wait that's the whole thing.
          
          Shape 1 (You): Polygon (200,0) -> (100, 173) -> (200, 230) -> (300, 173).
          This is a kite at the top.
          
          Let's just implement relatively positioned divs with clip-paths as it's easier to style with Tailwind.
      */}

      {/* 
         Let's try a simple approach:
         A big triangle container.
         Split into 3 clickable areas roughly corresponding to the image.
      */}

      <g transform="translate(0,0)">
        {/* Top Area (You) */}
        <path
          d="M200 0 L400 346 L0 346 Z"
          fill="none"
          stroke="none"
        />

        {/* Top Part: "You" */}
        <path
          d="M200 0 L320 200 L80 200 Z"
          className={selectedType === 'self' ? selectedClass : defaultClass}
          onClick={() => onSelect('self')}
        />
        <text x="200" y="140" textAnchor="middle" fill="white" className="font-bold pointer-events-none">あなた</text>
        <text x="200" y="160" textAnchor="middle" fill="white" className="text-xs pointer-events-none">{counts.self} items</text>

        {/* Left Part: "Target" */}
        <path
          d="M85 210 L35 -10 L200 350 Z" /* Wrong coordinates logic */
        /* Let's construct strictly */
        />
      </g>
    </svg>
  );
}

// 3rd Attempt: High quality CSS Grid based or SVG with calculated paths
export function TriangleThreeWay({ onSelect, selectedType, counts }: TriangleChartProps) {
  const activeClass = "fill-[#f97316] stroke-stone-800 stroke-[4px]";
  const inactiveClass = "fill-stone-600 hover:fill-stone-500 transition-colors cursor-pointer stroke-stone-800 stroke-[4px]";

  // Coordinates for an equilateral triangle of side 400
  // Height = 346.4
  // Top: 200, 0
  // Left: 0, 346
  // Right: 400, 346
  // Centroid: 200, 231

  // We split into 3 quadrilaterals meeting at centroid?
  // Or just 3 colored triangles?
  // Let's emulate the book: Top triangle, Left Bottom Triangle, Right Bottom Triangle. 
  // They are arranged to form a big triangle.
  // Top: (200, 0), (100, 173), (300, 173)
  // Left: (0, 346), (100, 173), (200, 346)
  // Right: (400, 346), (300, 173), (200, 346)
  // Center Hole: (100, 173), (300, 173), (200, 346) -> This is the inverted triangle in the middle.
  // If we fill the middle hole, who does it belong to?
  // The user image shows NO HOLE. The lines meet at a point.
  // Center point: (200, 231)

  // Area 1 (Top - You): (200,0) -> (300,173) -> (200,231) -> (100,173) -> (200,0)
  // Area 2 (Right - Third): (300,173) -> (400,346) -> (200,346) -> (200,231) -> (300,173)
  // Area 3 (Left - Target): (100,173) -> (200,231) -> (200,346) -> (0,346) -> (100,173)

  return (
    <svg width="100%" height="100%" viewBox="0 0 400 350" className="max-w-[380px] mx-auto overflow-visible filter drop-shadow-xl">
      {/* Top (You) */}
      <path
        d="M200 4 L102 173 L200 231 L298 173 Z"
        className={selectedType === 'self' ? activeClass : inactiveClass}
        onClick={() => onSelect('self')}
      />
      <text x="200" y="130" textAnchor="middle" fill="white" className="font-bold text-lg pointer-events-none">あなた</text>
      <text x="200" y="150" textAnchor="middle" fill="white" className="text-sm pointer-events-none">({counts.self})</text>

      {/* Left (Target) */}
      <path
        d="M4 346 L102 173 L200 231 L200 346 Z"
        className={selectedType === 'target' ? activeClass : inactiveClass}
        onClick={() => onSelect('target')}
      />
      <text x="120" y="280" textAnchor="middle" fill="white" className="font-bold text-lg pointer-events-none">ターゲット</text>
      <text x="120" y="300" textAnchor="middle" fill="white" className="text-sm pointer-events-none">({counts.target})</text>

      {/* Right (Third Party) */}
      <path
        d="M396 346 L298 173 L200 231 L200 346 Z"
        className={selectedType === 'third-party' ? activeClass : inactiveClass}
        onClick={() => onSelect('third-party')}
      />
      <text x="280" y="280" textAnchor="middle" fill="white" className="font-bold text-lg pointer-events-none">第三者</text>
      <text x="280" y="300" textAnchor="middle" fill="white" className="text-sm pointer-events-none">({counts['third-party']})</text>
    </svg>
  );
}
