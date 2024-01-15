import { RefObject } from "preact";
import { memo } from "preact/compat";
import { useEffect, useState } from "preact/hooks";
import { JSX } from "preact/jsx-runtime";
import { assert, mouseEvents } from "../util";

const VIEW_HEIGHT = 2000;

/**
 * TODO Need to preserve drag offset after window resize events
 */
function useScreenPanning(
  view: RefObject<SVGSVGElement> | undefined,
  screen: { width: number; height: number; dpi: number },
  { disabled }: { disabled: boolean }
) {
  useEffect(() => {
    if (!view) return;
    if (disabled) return;
    assert(view.current);
    let down = false;
    let start: [number, number] = [
      view.current.viewBox.baseVal.x / screen.dpi,
      view.current.viewBox.baseVal.y / screen.dpi,
    ];

    const unsubscribe = mouseEvents(view.current, {
      onDown(e) {
        assert(view.current);
        // don't pan on right click
        if (e.which === 3) return;
        down = true;
        start = [
          e.offsetX + view.current.viewBox.baseVal.x / screen.dpi,
          e.offsetY + view.current.viewBox.baseVal.y / screen.dpi,
        ];
      },
      onMove(e) {
        if (!down) return;

        assert(view.current);
        const dpi = screen.dpi;
        view.current.viewBox.baseVal.x = dpi * (start[0] - e.offsetX);
        view.current.viewBox.baseVal.y = dpi * (start[1] - e.offsetY);
      },
      onUp() {
        down = false;
      },
      onLeave() {
        down = false;
      },
    });

    return unsubscribe;
  }, [screen]);
}

function useScreen(
  view: RefObject<SVGSVGElement>,
  options: {
    disablePanning: boolean;
  }
) {
  const [state, setState] = useState(() => {
    // assert(view.current, "ref not set?");
    return {
      height: window.innerHeight,
      width: window.innerWidth,
      dpi:
        // (view.current.clientWidth / view.current.clientHeight) *
        // (VIEW_HEIGHT / view.current.clientWidth),
        (window.innerWidth / window.innerHeight) *
        (VIEW_HEIGHT / window.innerWidth),
    };
  });

  useEffect(() => {
    console.log("setting dpi?");
    if (!view) return;
    const handle = () => {
      assert(view.current);
      // setState({
      //   height: window.innerHeight,
      //   width: window.innerWidth,
      //   dpi: view.current.viewBox.baseVal.width / window.innerWidth,
      // });
      setState({
        height: view.current.clientHeight,
        width: view.current.clientWidth,
        dpi: view.current.viewBox.baseVal.width / view.current.clientWidth,
      });
    };
    window.addEventListener("resize", handle);
    return () => {
      window.removeEventListener("resize", handle);
    };
  }, []);

  console.log(state);

  useScreenPanning(view, state, { disabled: options.disablePanning });

  return state;
}

function disableContextMenu(e: JSX.TargetedMouseEvent<SVGSVGElement>) {
  e.preventDefault();
}

export const SvgView = memo(function SvgView({
  svgRef,
  children,
  disablePanning = false,
}: {
  svgRef: RefObject<SVGSVGElement>;
  children: JSX.Element | JSX.Element[];
  disablePanning?: boolean;
}) {
  const screen = useScreen(svgRef, { disablePanning });
  const width = (screen.width / screen.height) * VIEW_HEIGHT;
  const viewBox = [
    (-1 / 2) * width,
    (-1 / 2) * VIEW_HEIGHT,
    width,
    VIEW_HEIGHT,
  ].join(" ");
  return (
    <svg
      onContextMenu={disableContextMenu}
      ref={svgRef}
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="unexplored-forest">
          <stop offset="5%" stop-color="green" />
          <stop offset="100%" stop-color="rgb(0, 50, 0)" />
        </radialGradient>
      </defs>
      {children}
    </svg>
  );
});
