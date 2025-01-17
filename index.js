/****************************************************
 * 1) GLOBAL SETUP & DOM REFERENCES
 ****************************************************/

// By default, let's keep the possible card ranks:
const ALL_CARD_VALUES = ["A", "K", "Q", "J", "10"]; 
// or just keep ["A","K","Q","J"] if you only want those four. 
// We'll handle the count logic separately.

// We'll store the card DOM elements in an array
let cardElements = [];
let hasFlipped = false; // track if we've done the big "Go" shuffle

// For the positions in the row. If we have up to 5 cards, let's define 5 slots.
const cardPositions = [0, 120, 240, 360, 480];
let cardY = 100; // we'll calculate the center of the screen later

/**
 * The center spot where we gather cards. 
 * If we want them to gather in the horizontal center between
 * the leftmost and rightmost used slot:
 *
 * We'll dynamically compute it based on how many cards we have!
 * (Because if we have 3 cards, the rightmost slot is index=2 => 240)
 */
let centerX = 0;
let centerY = 15;

// Grabbing references to DOM elements
const dealBtn = document.getElementById("dealBtn");
const goBtn = document.getElementById("goBtn");
const restartBtn = document.getElementById("restartBtn");
const cardCountInput = document.getElementById("cardCountInput");

// --- Button states on load
function setupButtonsInitial() {
  dealBtn.disabled = false;
  dealBtn.style.display = "inline-block";

  goBtn.disabled = true;
  goBtn.style.display = "none";

  restartBtn.disabled = false;
  restartBtn.style.display = "inline-block";

  cardCountInput.classList.remove("hidden"); 
  cardCountInput.disabled = false;
}

/****************************************************
 * 2) UTILITY FUNCTIONS
 ****************************************************/
/** Shuffle array in-place (Fisher-Yates). */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/** Disable all clicks on the cards (pointer-events: none). */
function disableCardClicks() {
  cardElements.forEach((card) => {
    card.classList.add("disabled-clicks");
  });
}

/** Re-enable clicks on the cards. */
function enableCardClicks() {
  cardElements.forEach((card) => {
    card.classList.remove("disabled-clicks");
  });
}

/** Remove all card elements from the DOM. */
function removeAllCardsFromBody() {
  const existing = document.querySelectorAll(".card");
  existing.forEach((c) => document.body.removeChild(c));
}

/****************************************************
 * 3) CREATE / INIT GAME
 ****************************************************/
/**
 * Initialize the game:
 *  - read user input (# of cards)
 *  - create that many cards, all face-down in the top-left deck position
 */
function initGame() {
  // Clear old stuff
  removeAllCardsFromBody();
  cardElements = [];
  hasFlipped = false;

  // Read how many cards from input
  let howMany = parseInt(cardCountInput.value, 10);
  if (!howMany || howMany < 3) howMany = 3;
  if (howMany > 5) howMany = 5;

  // For safety, let's slice from ALL_CARD_VALUES to get exactly 'howMany' ranks.
  // If you prefer strictly A/K/Q/J for 4, you'll handle that differently. 
  // This is a sample approach to demonstrate up to 5 unique cards.
  const chosenRanks = ALL_CARD_VALUES.slice(0, howMany);

  // Shuffle them if you want
  shuffle(chosenRanks);

  // Compute the new centerX based on the leftmost slot=0 and the rightmost slot=(howMany-1)
  const leftPos = cardPositions[0];
  const rightPos = cardPositions[howMany - 1];
  centerX = (leftPos + rightPos) / 2; // midpoint

  // Create each card
  for (let i = 0; i < howMany; i++) {
    const rank = chosenRanks[i];
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card", "deck-position", "flipped");
    // "deck-position" => top-left corner, half-size, face-down
    // "flipped" => front is hidden, back is visible

    // We'll store the intended slotIndex for later
    cardDiv.dataset.slotIndex = i;
    cardDiv.dataset.value = rank;

    // We'll store a placeholder zIndex for now; 
    // it can be changed just before shuffling if you like.
    // Initially, let's just do zIndex=2, but it's not important
    cardDiv.style.zIndex = 2;

    // Build the flipping wrapper
    const cardTransition = document.createElement("div");
    cardTransition.classList.add("card-transition");

    // Front face
    const frontFace = document.createElement("div");
    frontFace.classList.add("card-face", "front");
    frontFace.textContent = rank;

    // Back face
    const backFace = document.createElement("div");
    backFace.classList.add("card-face", "back");

    cardTransition.appendChild(frontFace);
    cardTransition.appendChild(backFace);
    cardDiv.appendChild(cardTransition);
    document.body.appendChild(cardDiv);

    // Click event -> flip card face-up
    cardDiv.addEventListener("click", () => {
      if (
        cardDiv.classList.contains("flipped") &&
        !cardDiv.classList.contains("disabled-clicks")
      ) {
        cardDiv.classList.remove("flipped");
      }
    });

    cardElements.push(cardDiv);
  }

  goBtn.textContent = "Play";
}

/****************************************************
 * 4) DEAL (fly in) ANIMATION
 ****************************************************/
function dealCards() {
  // Hide the input so user can't change count mid-game
  cardCountInput.classList.add("hidden");
  cardCountInput.disabled = true;

  // find the center of the screen vertically
  let windowHeight = window.innerHeight;
  let pageCenterY = windowHeight / 2 - 50; // 50 is half the card height

  setTimeout(() => {
    cardElements.forEach((card) => {
      // Remove deck-position => triggers transition from top-left to row
      card.classList.remove("deck-position");
      // Unflip => show front
      card.classList.remove("flipped");

      const slotIndex = parseInt(card.dataset.slotIndex, 10);
      card.style.transform = `translate(${cardPositions[slotIndex]}px, ${pageCenterY}px) scale(1) rotateY(0deg)`;
    });
  }, 50);
}

/****************************************************
 * 5) "GO" LOGIC: FLIP DOWN, RANDOMIZE Z-INDEX, GATHER, REDISTRIBUTE
 ****************************************************/
/**
 * Flip all cards face-down.
 */
function flipAllCards() {
  cardElements.forEach((card) => {
    card.classList.add("flipped");
  });
}

/**
 * Right before the shuffle animation, 
 * assign random zIndices from 1..N (where N is howMany).
 * That ensures each card has a unique z‐index, but in random order.
 */
function randomizeZIndices() {
  // Suppose we have 'howMany' = cardElements.length
  const howMany = cardElements.length;

  // Create an array of zIndices [1..howMany], shuffle
  let zArray = [];
  for (let i = 1; i <= howMany; i++) zArray.push(i);
  shuffle(zArray);

  // Assign them in the new random order
  cardElements.forEach((card, idx) => {
    card.style.zIndex = zArray[idx];
  });
}

/**
 * Gather cards to centerX/centerY
 */
function gatherAllCardsToCenter() {
  let windowHeight = window.innerHeight;
  let pageCenterY = windowHeight / 2 - 50; // 50 is half the card height
  cardElements.forEach((card) => {
    card.style.transform = `translate(${centerX}px, ${pageCenterY}px) scale(1)`;
  });
}

/**
 * Randomly reassign slots and animate to new positions
 */
function redistributeAllCardsRandomly() {
  // We'll create an array of possible slots [0..howMany-1],
  // shuffle it, then reassign each card
  const howMany = cardElements.length;
  let slots = [];
  for (let i = 0; i < howMany; i++) {
    slots.push(i);
  }
  shuffle(slots);

  // find the center of the screen vertically
  let windowHeight = window.innerHeight;
  let pageCenterY = windowHeight / 2 - 50; // 50 is half the card height

  cardElements.forEach((card, i) => {
    const newSlotIndex = slots[i];
    card.dataset.slotIndex = newSlotIndex;
    card.style.transform = `translate(${cardPositions[newSlotIndex]}px, ${pageCenterY}px) scale(1)`;
  });
}

/****************************************************
 * 6) RESTART (OFF-STAGE ANIMATION + DOM REMOVAL)
 ****************************************************/
function animateCardsOffstageAndRemove() {
  // 1) Move each card to .offstage => y=1200px, scale=0.5
  // 2) Wait 1s, then remove from DOM
  cardElements.forEach((card) => {
    card.classList.add("offstage");
  });

  // After 1s, remove them from DOM
  setTimeout(() => {
    removeAllCardsFromBody();
    // Re-init
    setupButtonsInitial();
    initGame();
  }, 1000);
}

/****************************************************
 * 7) BUTTON HANDLERS
 ****************************************************/
// "Deal" button
dealBtn.addEventListener("click", () => {
  dealBtn.disabled = true;
  dealBtn.style.display = "none";

  dealCards();

  // after 1s, show "Go"
  setTimeout(() => {
    goBtn.disabled = false;
    goBtn.style.display = "inline-block";
  }, 1000);
});

// "Go" button
goBtn.addEventListener("click", () => {
  goBtn.disabled = true;
  goBtn.style.display = "none";

  if (!hasFlipped) {
    hasFlipped = true;

    // 1) Disable clicks
    disableCardClicks();

    // 2) Flip face-down
    flipAllCards();

    // 2.1) Randomize zIndices right before shuffle animation
    // We'll do it after a small delay so we can see them flip first
    setTimeout(() => {
      randomizeZIndices();
    }, 600);

    // 3) Wait 1.1s => gather
    setTimeout(() => {
      gatherAllCardsToCenter();

      // 4) Wait 1s gather + 0.5s pause => redistribute
      setTimeout(() => {
        redistributeAllCardsRandomly();

        // 5) Wait 1s => re-enable clicks
        setTimeout(() => {
          enableCardClicks();
        }, 1000);

      }, 1500);

    }, 1100);

    goBtn.textContent = "Cards are shuffled! Click on any card to reveal.";
  } else {
    alert("Click on a card to reveal it, or press Restart to play again.");
  }
});

// "Restart" button
restartBtn.addEventListener("click", () => {
  // Animate the current cards off-stage, then remove them
  animateCardsOffstageAndRemove();
});

/****************************************************
 * 8) ON PAGE LOAD
 ****************************************************/
setupButtonsInitial();
initGame(); 
