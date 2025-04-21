import { useState, useEffect, useRef } from "react";

export default function RollingAsciiAnimation() {
  const [position, setPosition] = useState(0);
  const containerRef = useRef(null);

  // The ASCII art (isometric pattern)
  const asciiArt = `> make build
Compiling...
Compiling...
Compiling...
You really thought it would work on the first try?

> make clean && make dirty
Cleaning...
System is now a glorious mess

> git status
On branch chaos
Untracked files:
  - sanity-check.js
  - why_does_this_work.txt

> ./debug.sh
🔍 Searching for bugs...
Found 867 problems in 3 lines of code

> g++ -o app main.cpp utils.cpp emotions.cpp
main.cpp: undefined reference to 'motivation'
emotions.cpp: warning: variable 'happiness' is unused

> npm start
Starting...
Oops! Looks like you meant \`npm struggle\`

> printf("Fixing one bug...\\n")
Fixing one bug...
...
Introducing three new ones!

> valgrind ./app
== Leaks detected ==
== Most of them are emotional ==

> git log --oneline
f0f0f0a - added feature
b4dc0de - hotfix for feature
deadbeef - removed feature
cafebabe - put feature back

> python3 -m this
The Zen of Python, by Tim Peters
(also available as a throw pillow)

> ./compile_everything.sh
Compiling frontend...
Compiling backend...
Compiling regrets...
Compilation complete with 420 warnings

> docker run --rm -it infinite_loop:latest
Container started.
Container started.
Container started.
Container started...

`;

  // Define the number of visible lines (40 lines)
  const visibleLines = 50;

  // Calculate the total number of lines in the ASCII art
  const calculateMaxHeight = () => {
    return asciiArt.split("\n").length;
  };

  // Create duplicated ASCII art for seamless looping
  const createDuplicatedArt = () => {
    return asciiArt + "\n" + asciiArt; // Concatenate the art to create a continuous effect
  };

  // Create the animation frame with the current position (vertical scrolling)
  const createAnimationFrame = () => {
    const duplicatedArt = createDuplicatedArt();
    const lines = duplicatedArt.split("\n");
    const totalHeight = calculateMaxHeight();

    // For vertical scrolling, slice the lines based on the position
    return lines.slice(position, position + visibleLines).join("\n");
  };

  useEffect(() => {
    // Animation loop
    const intervalId = setInterval(() => {
      setPosition((prevPos) => {
        const nextPos = prevPos + 1;
        // Ensure the scroll position loops back to the start after reaching the end
        return nextPos >= calculateMaxHeight() ? 0 : nextPos;
      });
    }, 300); // Adjusted speed for smoother vertical scroll

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex justify-center items-start w-full h-full">
      <div
        ref={containerRef}
        className="overflow-hidden"
        style={{ height: `${visibleLines * 1}em` }} // Adjust container height to 40 lines
      >
        <pre className="font-mono text-green-500 text-xs sm:text-sm whitespace-pre">
          {createAnimationFrame()}
        </pre>
      </div>
    </div>
  );
}
