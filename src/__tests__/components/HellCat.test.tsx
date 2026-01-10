/**
 * @jest-environment jsdom
 */
import { render } from "@testing-library/react";

import { HellCat } from "../../components/CatGenerator/HellCat";
import { generateRandomCat } from "../../components/CatGenerator/helpers";
import { type CatConfig } from "../../components/CatGenerator/types";

const baseConfig: CatConfig = {
  hornStyle: "curved",
  eyeColor: "fire",
  flameIntensity: "medium",
  pose: "sitting",
  accessories: ["collar"],
  colorScheme: "classic",
  eyeGlow: 50,
  hornSize: 60,
  tailLength: 70,
  bodySize: 50,
  flameHeight: 50,
  wickedness: 60,
  markings: "none",
  expression: "neutral",
};

describe("HellCat snapshots", () => {
  it("matches base cat", () => {
    const { asFragment } = render(<HellCat config={baseConfig} />);
    expect(asFragment()).toMatchInlineSnapshot(`
      <DocumentFragment>
        <div
          class="flex w-full justify-center"
        >
          <svg
            class="w-full max-w-sm"
            id="hell-cat-svg"
            viewBox="0 0 400 320"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <filter
                id="glow"
              >
                <fegaussianblur
                  result="coloredBlur"
                  stdDeviation="1.5"
                />
                <femerge>
                  <femergenode
                    in="coloredBlur"
                  />
                  <femergenode
                    in="SourceGraphic"
                  />
                </femerge>
              </filter>
            </defs>
            <g>
              <path
                class="animate-glow-pulse"
                d="M280,180 Q344,160 366,200 Q355,240 290,220 Q285,200 280,180"
                fill="#2d1b1b"
                stroke="#000"
                stroke-width="2"
                transform="scale(1, 0.75) translate(-20, 20), rotate(-30, 280, 180)"
              />
              <ellipse
                cx="160"
                cy="210"
                fill="#2d1b1b"
                rx="15.499999999999998"
                ry="25.83333333333333"
                stroke="#000"
                stroke-width="2"
              />
              <ellipse
                cx="240"
                cy="210"
                fill="#2d1b1b"
                rx="15.499999999999998"
                ry="25.83333333333333"
                stroke="#000"
                stroke-width="2"
              />
              <ellipse
                cx="200"
                cy="170"
                fill="#2d1b1b"
                rx="82.66666666666666"
                ry="61.99999999999999"
                stroke="#000"
                stroke-width="2"
              />
              <g
                transform="translate(0, 12)"
              >
                <path
                  d="M165,155 Q200,170 235,155"
                  fill="none"
                  stroke="#8b0000"
                  stroke-linecap="round"
                  stroke-width="16"
                />
                <circle
                  class="animate-flicker"
                  cx="200"
                  cy="162"
                  fill="#ff4500"
                  r="5"
                />
              </g>
              <circle
                cx="200"
                cy="120"
                fill="#2d1b1b"
                r="51.66666666666666"
                stroke="#000"
                stroke-width="2"
              />
              <path
                d="M158.66666666666669,89 L169.00000000000003,58.00000000000001 L184.50000000000003,83.83333333333334 Z"
                fill="#2d1b1b"
                stroke="#000"
                stroke-width="2"
              />
              <path
                d="M215.5,83.83333333333334 L231,58.00000000000001 L241.33333333333334,89 Z"
                fill="#2d1b1b"
                stroke="#000"
                stroke-width="2"
              />
              <path
                d="M165.9,80.73333333333333 L171.0666666666667,66.26666666666667 L179.33333333333334,78.66666666666667 Z"
                fill="#8b0000"
              />
              <path
                d="M220.66666666666669,78.66666666666667 L228.93333333333334,66.26666666666667 L234.10000000000002,80.73333333333333 Z"
                fill="#8b0000"
              />
              <ellipse
                class=""
                cx="185"
                cy="110"
                fill="#ff4500"
                filter="url(#glow)"
                rx="8"
                ry="12"
                stroke="#000"
              />
              <ellipse
                class=""
                cx="215"
                cy="110"
                fill="#ff4500"
                filter="url(#glow)"
                rx="8"
                ry="12"
                stroke="#000"
              />
              <ellipse
                cx="185"
                cy="112"
                fill="#000"
                rx="3"
                ry="8"
              />
              <ellipse
                cx="215"
                cy="112"
                fill="#000"
                rx="3"
                ry="8"
              />
              <path
                d="M200,125 L195,135 L205,135 Z"
                fill="#8b0000"
                stroke="#000"
              />
              <path
                d="M200,135 Q190,145 185,140 M200,135 Q210,145 215,140"
                fill="none"
                stroke="#000"
                stroke-width="2"
              />
              <path
                d="M190,140 L186.8,153 L192,145 Z"
                fill="#fff"
                stroke="#666"
              />
              <path
                d="M210,140 L208,145 L213.2,153 Z"
                fill="#fff"
                stroke="#666"
              />
              <ellipse
                cx="170"
                cy="215"
                fill="#2d1b1b"
                rx="15.499999999999998"
                ry="25.83333333333333"
                stroke="#000"
                stroke-width="2"
                transform="rotate(-35,170,215)"
              />
              <ellipse
                cx="230"
                cy="215"
                fill="#2d1b1b"
                rx="15.499999999999998"
                ry="25.83333333333333"
                stroke="#000"
                stroke-width="2"
                transform="rotate(35,230,215)"
              />
            </g>
            <g
              class="animate-glow-pulse"
            >
              <path
                d="M165,85 Q136.8,60.4 131.8,47.2 Q123.6,34 136.8,25.8 Q153.2,42.2 145,85"
                fill="#8b0000"
                stroke="#000"
                stroke-width="1"
              />
            </g>
            <g
              class="animate-glow-pulse"
            >
              <path
                d="M165,85 Q136.8,60.4 131.8,47.2 Q123.6,34 136.8,25.8 Q153.2,42.2 145,85"
                fill="#8b0000"
                stroke="#000"
                stroke-width="1"
                transform="scale(-1, 1) translate(-400, 0)"
              />
            </g>
          </svg>
        </div>
      </DocumentFragment>
    `);
  });

  it("matches accessories/markings variant", () => {
    const { asFragment } = render(
      <HellCat
        config={{
          ...baseConfig,
          accessories: ["collar", "crown"],
          markings: "flames",
          colorScheme: "fire",
          expression: "menacing",
        }}
      />
    );
    expect(asFragment()).toMatchInlineSnapshot(`
      <DocumentFragment>
        <div
          class="flex w-full justify-center"
        >
          <svg
            class="w-full max-w-sm"
            id="hell-cat-svg"
            viewBox="0 0 400 320"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <filter
                id="glow"
              >
                <fegaussianblur
                  result="coloredBlur"
                  stdDeviation="1.5"
                />
                <femerge>
                  <femergenode
                    in="coloredBlur"
                  />
                  <femergenode
                    in="SourceGraphic"
                  />
                </femerge>
              </filter>
            </defs>
            <g>
              <path
                class="animate-glow-pulse"
                d="M280,180 Q344,160 366,200 Q355,240 290,220 Q285,200 280,180"
                fill="#3d0000"
                stroke="#000"
                stroke-width="2"
                transform="scale(1, 0.75) translate(-20, 20), rotate(-30, 280, 180)"
              />
              <ellipse
                cx="160"
                cy="210"
                fill="#3d0000"
                rx="15.499999999999998"
                ry="25.83333333333333"
                stroke="#000"
                stroke-width="2"
              />
              <ellipse
                cx="240"
                cy="210"
                fill="#3d0000"
                rx="15.499999999999998"
                ry="25.83333333333333"
                stroke="#000"
                stroke-width="2"
              />
              <ellipse
                cx="200"
                cy="170"
                fill="#3d0000"
                rx="82.66666666666666"
                ry="61.99999999999999"
                stroke="#000"
                stroke-width="2"
              />
              <g
                opacity="0.8"
              >
                <path
                  d="M180,140 Q175,130 180,125 Q185,135 180,140"
                  fill="#ffff00"
                />
                <path
                  d="M220,145 Q215,135 220,130 Q225,140 220,145"
                  fill="#ffff00"
                />
              </g>
              <g
                transform="translate(0, 12)"
              >
                <path
                  d="M165,155 Q200,170 235,155"
                  fill="none"
                  stroke="#ff6600"
                  stroke-linecap="round"
                  stroke-width="16"
                />
                <circle
                  class="animate-flicker"
                  cx="200"
                  cy="162"
                  fill="#ffff00"
                  r="5"
                />
              </g>
              <circle
                cx="200"
                cy="120"
                fill="#3d0000"
                r="51.66666666666666"
                stroke="#000"
                stroke-width="2"
              />
              <g>
                <path
                  class="animate-glow-pulse"
                  d="M170,80 L180,60 L190,75 L200,55 L210,75 L220,60 L230,80 L200,85 Z"
                  fill="#ffff00"
                  stroke="#000"
                  stroke-width="2"
                />
                <circle
                  cx="200"
                  cy="70"
                  fill="#ff6600"
                  r="3"
                />
              </g>
              <path
                d="M158.66666666666669,89 L169.00000000000003,58.00000000000001 L184.50000000000003,83.83333333333334 Z"
                fill="#3d0000"
                stroke="#000"
                stroke-width="2"
              />
              <path
                d="M215.5,83.83333333333334 L231,58.00000000000001 L241.33333333333334,89 Z"
                fill="#3d0000"
                stroke="#000"
                stroke-width="2"
              />
              <path
                d="M165.9,80.73333333333333 L171.0666666666667,66.26666666666667 L179.33333333333334,78.66666666666667 Z"
                fill="#ff6600"
              />
              <path
                d="M220.66666666666669,78.66666666666667 L228.93333333333334,66.26666666666667 L234.10000000000002,80.73333333333333 Z"
                fill="#ff6600"
              />
              <ellipse
                class=""
                cx="185"
                cy="110"
                fill="#ffff00"
                filter="url(#glow)"
                rx="10"
                ry="8"
                stroke="#000"
              />
              <ellipse
                class=""
                cx="215"
                cy="110"
                fill="#ffff00"
                filter="url(#glow)"
                rx="10"
                ry="8"
                stroke="#000"
              />
              <ellipse
                cx="185"
                cy="112"
                fill="#000"
                rx="4"
                ry="6"
              />
              <ellipse
                cx="215"
                cy="112"
                fill="#000"
                rx="4"
                ry="6"
              />
              <path
                d="M200,125 L195,135 L205,135 Z"
                fill="#ff6600"
                stroke="#000"
              />
              <path
                d="M200,135 Q187,146.8 183.8,140 M200,135 Q213,146.8 216.2,140"
                fill="none"
                stroke="#000"
                stroke-width="2"
              />
              <path
                d="M190,140 L186.8,153 L192,145 Z"
                fill="#fff"
                stroke="#666"
              />
              <path
                d="M210,140 L208,145 L213.2,153 Z"
                fill="#fff"
                stroke="#666"
              />
              <ellipse
                cx="170"
                cy="215"
                fill="#3d0000"
                rx="15.499999999999998"
                ry="25.83333333333333"
                stroke="#000"
                stroke-width="2"
                transform="rotate(-35,170,215)"
              />
              <ellipse
                cx="230"
                cy="215"
                fill="#3d0000"
                rx="15.499999999999998"
                ry="25.83333333333333"
                stroke="#000"
                stroke-width="2"
                transform="rotate(35,230,215)"
              />
            </g>
            <g
              class="animate-glow-pulse"
            >
              <path
                d="M165,85 Q136.8,60.4 131.8,47.2 Q123.6,34 136.8,25.8 Q153.2,42.2 145,85"
                fill="#ff6600"
                stroke="#000"
                stroke-width="1"
              />
            </g>
            <g
              class="animate-glow-pulse"
            >
              <path
                d="M165,85 Q136.8,60.4 131.8,47.2 Q123.6,34 136.8,25.8 Q153.2,42.2 145,85"
                fill="#ff6600"
                stroke="#000"
                stroke-width="1"
                transform="scale(-1, 1) translate(-400, 0)"
              />
            </g>
          </svg>
        </div>
      </DocumentFragment>
    `);
  });

  it("matches hash-based generated cat", () => {
    const seeded = generateRandomCat("user@example.com");
    const { asFragment } = render(<HellCat config={seeded} />);
    expect(asFragment()).toMatchInlineSnapshot(`
      <DocumentFragment>
        <div
          class="flex w-full justify-center"
        >
          <svg
            class="w-full max-w-sm"
            id="hell-cat-svg"
            viewBox="0 0 400 320"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <filter
                id="glow"
              >
                <fegaussianblur
                  result="coloredBlur"
                  stdDeviation="0.27"
                />
                <femerge>
                  <femergenode
                    in="coloredBlur"
                  />
                  <femergenode
                    in="SourceGraphic"
                  />
                </femerge>
              </filter>
            </defs>
            <g>
              <path
                class="animate-glow-pulse"
                d="M280,180 Q347.8,160 371.7,200 Q359.75,240 290,220 Q285,200 280,180"
                fill="#ffd700"
                stroke="#000"
                stroke-width="2"
                transform="scale(1, 0.75) translate(-20, 40), rotate(30, 280, 180)"
              />
              <ellipse
                cx="160"
                cy="230"
                fill="#ffd700"
                rx="15.499999999999998"
                ry="25.83333333333333"
                stroke="#000"
                stroke-width="2"
              />
              <ellipse
                cx="240"
                cy="230"
                fill="#ffd700"
                rx="15.499999999999998"
                ry="25.83333333333333"
                stroke="#000"
                stroke-width="2"
              />
              <ellipse
                cx="200"
                cy="190"
                fill="#ffd700"
                rx="82.66666666666666"
                ry="61.99999999999999"
                stroke="#000"
                stroke-width="2"
              />
              <g
                opacity="0.6"
              >
                <path
                  d="M160,160 Q200,155 240,160"
                  fill="none"
                  stroke="#ffa500"
                  stroke-width="3"
                />
                <path
                  d="M155,180 Q200,175 245,180"
                  fill="none"
                  stroke="#ffa500"
                  stroke-width="3"
                />
                <path
                  d="M160,200 Q200,195 240,200"
                  fill="none"
                  stroke="#ffa500"
                  stroke-width="3"
                />
              </g>
              <g
                transform="translate(0, 12)"
              >
                <path
                  d="M165,155 Q200,170 235,155"
                  fill="none"
                  stroke="#ffa500"
                  stroke-linecap="round"
                  stroke-width="16"
                />
                <circle
                  class="animate-flicker"
                  cx="200"
                  cy="162"
                  fill="#fff8dc"
                  r="5"
                />
              </g>
              <circle
                cx="200"
                cy="120"
                fill="#ffd700"
                r="51.66666666666666"
                stroke="#000"
                stroke-width="2"
              />
              <g>
                <path
                  class="animate-glow-pulse"
                  d="M170,80 L180,60 L190,75 L200,55 L210,75 L220,60 L230,80 L200,85 Z"
                  fill="#fff8dc"
                  stroke="#000"
                  stroke-width="2"
                />
                <circle
                  cx="200"
                  cy="70"
                  fill="#ffa500"
                  r="3"
                />
              </g>
              <path
                d="M158.66666666666669,89 L169.00000000000003,58.00000000000001 L184.50000000000003,83.83333333333334 Z"
                fill="#ffd700"
                stroke="#000"
                stroke-width="2"
              />
              <path
                d="M215.5,83.83333333333334 L231,58.00000000000001 L241.33333333333334,89 Z"
                fill="#ffd700"
                stroke="#000"
                stroke-width="2"
              />
              <path
                d="M165.9,80.73333333333333 L171.0666666666667,66.26666666666667 L179.33333333333334,78.66666666666667 Z"
                fill="#ffa500"
              />
              <path
                d="M220.66666666666669,78.66666666666667 L228.93333333333334,66.26666666666667 L234.10000000000002,80.73333333333333 Z"
                fill="#ffa500"
              />
              <ellipse
                class=""
                cx="185"
                cy="110"
                fill="#fff8dc"
                filter="none"
                rx="8"
                ry="4"
                stroke="#000"
              />
              <ellipse
                class=""
                cx="215"
                cy="110"
                fill="#fff8dc"
                filter="none"
                rx="8"
                ry="4"
                stroke="#000"
              />
              <ellipse
                cx="185"
                cy="112"
                fill="#000"
                rx="2"
                ry="2"
              />
              <ellipse
                cx="215"
                cy="112"
                fill="#000"
                rx="2"
                ry="2"
              />
              <path
                d="M200,125 L195,135 L205,135 Z"
                fill="#ffa500"
                stroke="#000"
              />
              <path
                d="M200,135 Q190,143 185,142 M200,135 Q210,143 215,142"
                fill="none"
                stroke="#000"
                stroke-width="2"
              />
              <path
                d="M190,140 L186.5,153.75 L192,145 Z"
                fill="#fff"
                stroke="#666"
              />
              <path
                d="M210,140 L208,145 L213.5,153.75 Z"
                fill="#fff"
                stroke="#666"
              />
              <ellipse
                cx="170"
                cy="235"
                fill="#ffd700"
                rx="15.499999999999998"
                ry="25.83333333333333"
                stroke="#000"
                stroke-width="2"
                transform="rotate(30,170,235)"
              />
              <ellipse
                cx="230"
                cy="235"
                fill="#ffd700"
                rx="15.499999999999998"
                ry="25.83333333333333"
                stroke="#000"
                stroke-width="2"
                transform="rotate(-30,230,235)"
              />
            </g>
            <g
              class="animate-glow-pulse"
            >
              <path
                d="M160,85 L131.65,18.2 L148.35,18.2 L150,85"
                fill="#ffa500"
                stroke="#000"
                stroke-width="1"
              />
            </g>
            <g
              class="animate-glow-pulse"
            >
              <path
                d="M160,85 L131.65,18.2 L148.35,18.2 L150,85"
                fill="#ffa500"
                stroke="#000"
                stroke-width="1"
                transform="scale(-1, 1) translate(-400, 0)"
              />
            </g>
          </svg>
        </div>
      </DocumentFragment>
    `);
  });
});
