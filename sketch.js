const width = window.innerWidth;
const height = window.innerHeight;
const apiUrl = "https://api.thecatapi.com/v1/images/search?limit=10";

const svg = d3
  .select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

const background = d3.select(".background");
const overlay = d3.select(".overlay");
const overlayImage = d3.select("#overlay-image");
const overlayFact = d3.select("#overlay-fact");
const closeButton = d3.select(".close-button");
const infoButton = d3.select(".info-button");
const factBox = d3.select("#fact-box");

let currentColor = "#000000";
let currentBrushSize = 5;

// This function sets up a canvas for painting.
// It initializes the canvas, sets its size, and adds event listeners for mouse events.
// It's basically used for drawing with a mouse.

function setupPainter() {
  // Get the canvas element and its 2D rendering context...
  const canvas = document.getElementById("painter-canvas");
  const ctx = canvas.getContext("2d");

  // Set the canvas size
  canvas.width = 400;
  canvas.height = 400;

  // Initialize variables for drawing state
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;

  // Add event listeners for mouse events
  canvas.addEventListener("mousedown", startDrawing);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", stopDrawing);
  canvas.addEventListener("mouseout", stopDrawing);

  // Function to get the mouse position relative to the canvas
  function getMousePosition(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  // Function to start drawing
  function startDrawing(e) {
    isDrawing = true;
    const { x, y } = getMousePosition(e);
    [lastX, lastY] = [x, y];
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  // Function to draw
  function draw(e) {
    if (!isDrawing) return;
    const { x, y } = getMousePosition(e);
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentBrushSize;
    ctx.lineCap = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
    [lastX, lastY] = [x, y];
  }

  // Function to stop drawing
  function stopDrawing() {
    isDrawing = false;
    ctx.beginPath();
  }

  // Add event listeners for color and brush size buttons
  d3.selectAll(".color-button").on("click", function () {
    currentColor = d3.select(this).style("background-color");
  });

  d3.selectAll(".brush-size-button").on("click", function () {
    currentBrushSize = parseInt(d3.select(this).attr("data-size"));
  });

  // Add event listeners for clear and save buttons
  d3.select("#clear-button").on("click", function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  d3.select("#save-button").on("click", function () {
    const dataURL = canvas.toDataURL();
    saveDrawingLocally(dataURL);
  });

  // Add event listener for gallery button
  d3.select("#gallery-button").on("click", function () {
    openGallery();
  });
}

// This function saves a drawing (represented as a data URL) to the browser's local storage.
// It first retrieves an array of existing drawings from local storage. If no drawings exist,
// it initializes an empty array.
//
// The function then adds the new drawing (dataURL) to the array.
//
// After the new drawing is added, the updated array is stored back into local storage.
// This ensures that the new drawing is persisted across different sessions or page reloads.
//
// Finally, the function logs a message to the console indicating that the drawing has been saved locally.
function saveDrawingLocally(dataURL) {
  const drawings = JSON.parse(localStorage.getItem("drawings") || "[]");
  drawings.push(dataURL);
  localStorage.setItem("drawings", JSON.stringify(drawings));
  console.log("Drawing saved locally.");
}

/**
 * This function opens a new browser window and creates a simple HTML page in it.
 * The page displays a gallery of images retrieved from the browser's local storage.
 *
 * The function first retrieves the "drawings" key from the local storage. If the key
 * does not exist, it defaults to an empty array. The "drawings" key contains an
 * array of data URLs representing images.
 *
 * The function then opens a new browser window using the window.open() method. The
 * window is given the name "_blank" to indicate that it should open in a new tab.
 *
 * The new window's document is then written with an HTML structure that includes a
 * title for the gallery.
 *
 * The function then iterates over each drawing in the "drawings" array. For each
 * drawing, an HTML img tag is written into the new window's document. The src attribute
 * of the img tag is set to the drawing's data URL. The style attribute is used to set
 * the maximum width of the image to 100% and the margin-bottom to 10 pixels.
 *
 * After all the images have been written to the new window's document, the document is
 * closed with a closing </body></html> tag.
 */
function openGallery() {
  const drawings = JSON.parse(localStorage.getItem("drawings") || "[]");
  const galleryWindow = window.open("", "_blank");
  galleryWindow.document.write(
    "<html><head><title>Drawing Gallery</title></head><body>"
  );
  drawings.forEach((drawing) => {
    galleryWindow.document.write(
      `<img src="${drawing}" style="max-width: 100%; margin-bottom: 10px;">`
    );
  });
  galleryWindow.document.write("</body></html>");
}

// This function updates the art on the page by making an HTTP request to an API endpoint
// and using the response data to manipulate SVG elements.
function updateArt() {
  // Make an HTTP request to the API endpoint specified by the apiUrl variable.
  d3.json(apiUrl).then((data) => {
    // Select all the elements with the class "cat" and bind the data to them.
    const cats = svg.selectAll(".cat").data(data, (d) => d.id);

    // If there are any new elements in the data that are not currently on the page,
    // create them as a group element with the class "cat" and some initial attributes.
    const catsEnter = cats
      .enter()
      .append("g")
      .attr("class", "cat")
      .attr(
        "transform",
        (d, i) => `translate(${width / 2}, ${height / 2}) scale(0)`
      )
      .style("opacity", 0);

    // Inside each group, append an image element and set its attributes.
    catsEnter
      .append("image")
      .attr("class", "cat-image")
      .attr("xlink:href", (d) => d.url)
      .attr("width", 200)
      .attr("height", 200)
      .attr("x", -100)
      .attr("y", -100);

    // Append a text element and set its attributes.
    catsEnter
      .append("text")
      .attr("class", "cat-name")
      .attr("y", 120)
      .text((d, i) => `cat ${i + 1}`);

    // Add a click event listener to the image element.
    catsEnter.select(".cat-image").on("click", function (event, d) {
      // Calculate the maximum width and height based on the window size.
      const maxWidth = window.innerWidth * 0.8;
      const maxHeight = window.innerHeight * 0.5;
      // Calculate the image width and height, ensuring they do not exceed the maximum values.
      const imageWidth = Math.min(d.width, maxWidth);
      const imageHeight = Math.min(d.height, maxHeight);

      // Transition the image element to the new size and position.
      d3.select(this)
        .transition()
        .duration(500)
        .attr("width", imageWidth)
        .attr("height", imageHeight)
        .attr("x", -imageWidth / 2)
        .attr("y", -imageHeight / 2);

      // Generate a random fact about the cat.
      const facts = [
        `This cat is ${Math.floor(Math.random() * 10) + 1} years old.`,
        `This cat loves to play with ${
          ["yarn", "laser pointer", "cardboard box"][
            Math.floor(Math.random() * 3)
          ]
        }.`,
        `This cat's favorite food is ${
          ["fish", "chicken", "catnip"][Math.floor(Math.random() * 3)]
        }.`,
        `This cat sleeps for ${
          Math.floor(Math.random() * 8) + 12
        } hours a day.`,
      ];
      const randomFact = facts[Math.floor(Math.random() * facts.length)];
      // Display the random fact on the overlay.
      overlayFact.text(randomFact);

      // Set the source of the overlay image to the cat image URL.
      overlayImage.attr("src", d.url);
      // Show the overlay
      overlay.style("display", "flex");
      // Set up the painter
      setupPainter();
    });

    // Transition the existing elements to their new positions and scales.
    catsEnter
      .transition()
      .duration(500)
      .attr(
        "transform",
        (d, i) =>
          `translate(${(i % 5) * (width / 5) + width / 10}, ${
            Math.floor(i / 5) * (height / 2) + height / 4
          }) scale(1)`
      )
      .style("opacity", 1);

    // Now transition the existing elements that are no longer in the data set to disappear.
    cats
      .exit()
      .transition()
      .duration(500)
      .attr("transform", `translate(${width / 2}, ${height / 2}) scale(0)`)
      .style("opacity", 0)
      // Remove the elements from the DOM
      .remove();
  });
}

//  Create a function that changes the background color of the page.
//  It should pick a random color from the array of colors and transitions the background color to that color.

function changeBackground() {
  // Array of colors to choose from - DONE
  const colors = ["#f0f", "#0ff", "#ff0"];
  // Pick a random color from the array - DONE
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  // Change the background color to the random color - DONE
  background.transition().duration(500).style("background-color", randomColor);
}

// Try to display a random fact about cats on a webpage (maybe add an effect?)
function showFactBox() {
  const facts = [
    "Did you know that cats sleep for around 16 hours a day?",
    "The ancient Egyptians worshipped cats as gods!",
    "A cat's hearing is much more sensitive than humans and dogs.",
    "Cats have over 100 vocal sounds, while dogs only have about 10.",
    "The first cat in space was a French cat named Felicette in 1963.",
  ];

  // Now loop through the array and select a random fact - DONE
  const randomFact = facts[Math.floor(Math.random() * facts.length)];
  factBox.text(randomFact);
  factBox.transition().duration(500).style("opacity", 1);
}

// Hide the fact box by fading it out every now and then...
function hideFactBox() {
  factBox.transition().duration(500).style("opacity", 0);
}

// Find way to change the background color of the page on click:
// 1) Add a click event listener to the body - DONE
// 2) When the body is clicked:
//  2.1) Update the art - DONE
//  2.2) Change the background - DONE
//  2.3) Show the fact box - DONE

d3.select("body").on("click", function () {
  updateArt();
  changeBackground();
  showFactBox();
});

// Add a click event listener to the close button:
// When clicked, it should hide the overlay - WORKING...
closeButton.on("click", function () {
  overlay.style("display", "none");
});

// Add a click event listener to the info button:
// When clicked, it should display a message - LOL use an alert cause it's annoying (old internet style) - DONE
infoButton.on("click", function () {
  alert(
    "Welcome to the 90s cat Internet Art Experience!\n\nClick anywhere on the screen to generate new cat art and learn fun facts about cats. Click on a cat image to enlarge it and unleash your creativity with the cat Painter. Enjoy the nostalgic and interactive experience!"
  );
});

updateArt();
changeBackground();
