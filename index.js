/****************************************************
 * 1) GLOBAL SETUP & DOM REFERENCES
 ****************************************************/

const DEAL_TIME_OFFSET = 125; // 0.125s delay between each card deal

// Possible card ranks:
// const allCardValues = ["A", "K", "Q", "J", "10"];
let allCardValues = ["🐒","🦍","🦧","🐕","🐩","🐈","🐈‍⬛","🐅",
                          "🐆","🐎","🦌","🦬","🐂","🐃","🐄","🐖",
                          "🐏","🐑","🐐","🐪","🐫","🦙","🦒","🐘",
                          "🦣","🦏","🦛","🐁","🐀","🐇","🐿️","🦫",
                          "🦔","🦇","🦥","🦦","🦨","🦘","🦡","🦃",
                          "🐓","🐤","🐦","🐧","🕊️","🦅","🦆","🦢",
                          "🦉","🦤","🦩","🦚","🦜"];

// We'll store the card DOM elements in an array
let cardElements = [];
let hasFlipped = false; // track if we've done the big "Go" shuffle

// We define a max of 5 possible horizontal "slots" for up to 5 cards.
const SLOT_SPACING = 120;       // horizontal gap between cards
const CARD_WIDTH = 100;         // each card is 100px wide
const CARD_HEIGHT = 150;        // each card is 150px tall
let centerX = 0;                // gather center X
let centerY = 0;                // gather center Y

// DOM references
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
  removeAllCardsFromBody();
  cardElements = [];
  hasFlipped = false;

  // 1) Determine how many cards
  let howMany = parseInt(cardCountInput.value, 10);
  if (!howMany || howMany < 3) howMany = 3;
  if (howMany > 5) howMany = 5;

  // 2) Choose that many ranks from allCardValues
  //   Shuffle them so they're in random order
  shuffle(allCardValues);
  const chosenRanks = allCardValues.slice(0, howMany);
  shuffle(chosenRanks);

  // 3) For the gather center, let’s do the window center
  //    Then the card's center is at centerX, centerY, etc.
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  centerX = windowWidth / 2 - CARD_WIDTH / 2;  // center a single card horizontally
  centerY = windowHeight / 2 - CARD_HEIGHT / 2; 

  // 4) Create each card
  for (let i = 0; i < howMany; i++) {
    const rank = chosenRanks[i];
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card", "deck-position", "flipped");

    // We'll store the intended slotIndex for later
    cardDiv.dataset.slotIndex = i;
    cardDiv.dataset.value = rank;

    // Initially, zIndex=2 (or anything). We can randomize later if needed.
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

    // Clicking a face-down card => flip face-up
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
/**
 * We'll stagger dealing the cards so each card is delayed by 0.2s from the previous.
 * Also center them horizontally in the window.
 */
function dealCards() {
  // Hide the input so user can't change count mid-game
  cardCountInput.classList.add("hidden");
  cardCountInput.disabled = true;

  // howMany = number of cards
  const howMany = cardElements.length;
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // find vertical center
  const pageCenterY = windowHeight / 2 - CARD_HEIGHT / 2;

  // compute total width of the group of cards
  // e.g. for 3 cards => 2 gaps of 120 => 240, plus 100 for the last card => 340 total width
  // formula: totalWidth = ( (howMany -1) * SLOT_SPACING ) + CARD_WIDTH
  const totalWidth = (howMany - 1) * SLOT_SPACING + CARD_WIDTH;
  // compute the left offset so the group is centered horizontally
  const leftOffset = (windowWidth - totalWidth) / 2;

  // Now each card i has x = leftOffset + i*SLOT_SPACING
  // We'll do a small stagger with setTimeout => i * DEAL_TIME_OFFSET ms
  cardElements.forEach((card, i) => {
    setTimeout(() => {
      card.classList.remove("deck-position");  // remove top-left & half-scale
      card.classList.remove("flipped");        // unflip => show front

      const x = leftOffset + i * SLOT_SPACING;
      card.style.transform = `translate(${x}px, ${pageCenterY}px) scale(1) rotateY(0deg)`;
    }, 100 + i * DEAL_TIME_OFFSET); 
    // small base 0.1s delay so the first card doesn't move instantly,
    // then + DEAL_TIME_OFFSET ms for each subsequent card
  });
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
 * assign random zIndices from 1..N (where N = howMany).
 */
function randomizeZIndices() {
  const howMany = cardElements.length;
  let zArray = [];
  for (let i = 1; i <= howMany; i++) {
    zArray.push(i);
  }
  shuffle(zArray);

  cardElements.forEach((card, idx) => {
    card.style.zIndex = zArray[idx];
  });
}

/**
 * Gather cards at centerX, centerY.
 */
function gatherAllCardsToCenter() {
  cardElements.forEach((card) => {
    card.style.transform = `translate(${centerX}px, ${centerY}px) scale(1)`;
  });
}

/**
 * Randomly reassign slots and animate to new positions (still centered vertically).
 */
function redistributeAllCardsRandomly() {
  const howMany = cardElements.length;
  // create array [0..howMany-1], shuffle it
  let slots = [];
  for (let i = 0; i < howMany; i++) {
    slots.push(i);
  }
  shuffle(slots);

  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const pageCenterY = windowHeight / 2 - CARD_HEIGHT / 2;
  const totalWidth = (howMany - 1) * SLOT_SPACING + CARD_WIDTH;
  const leftOffset = (windowWidth - totalWidth) / 2;

  // reassign each card
  cardElements.forEach((card, i) => {
    const newSlotIndex = slots[i];
    card.dataset.slotIndex = newSlotIndex;
    const x = leftOffset + newSlotIndex * SLOT_SPACING;
    card.style.transform = `translate(${x}px, ${pageCenterY}px) scale(1)`;
  });
}

/****************************************************
 * 6) RESTART (OFF-STAGE ANIMATION + DOM REMOVAL)
 ****************************************************/
function animateCardsOffstageAndRemove() {
  cardElements.forEach((card) => {
    card.classList.add("offstage");
  });

  // After 1s, remove them from DOM
  setTimeout(() => {
    removeAllCardsFromBody();
    setupButtonsInitial();
    initGame();
  }, 1000);
}

/****************************************************
 * 7) BUTTON HANDLERS
 ****************************************************/
// "Deal"
dealBtn.addEventListener("click", () => {
  dealBtn.disabled = true;
  dealBtn.style.display = "none";

  dealCards();

  // after 1s + (0.2*(howMany-1)) approx, show "Go"
  // We'll be conservative and do e.g. 1s + 1s extra = 2s total
  setTimeout(() => {
    goBtn.disabled = false;
    goBtn.style.display = "inline-block";
  }, 2000);
});

// "Go"
goBtn.addEventListener("click", () => {
  goBtn.disabled = true;
  goBtn.style.display = "none";

  if (!hasFlipped) {
    hasFlipped = true;

    // 1) Disable clicks
    disableCardClicks();

    // 2) Flip face-down
    flipAllCards();

    // 2.1) randomizeZIndices after 0.6s
    setTimeout(() => {
      randomizeZIndices();
    }, 600);

    // 3) gather after 1.1s
    setTimeout(() => {
      gatherAllCardsToCenter();

      // 4) wait 1s gather + 0.5s => redistribute
      setTimeout(() => {
        redistributeAllCardsRandomly();

        // 5) after 1s => re-enable clicks
        setTimeout(() => {
          enableCardClicks();
        }, 1000);

      }, 1500);
    }, 1100);

    goBtn.textContent = "Cards are shuffled! Click any card to reveal.";
  } else {
    alert("Click on a card to reveal it, or press Restart to play again.");
  }
});

// "Restart"
restartBtn.addEventListener("click", () => {
  animateCardsOffstageAndRemove();
});

/****************************************************
 * 8) CARD COUNT INPUT LISTENER
 ****************************************************/
/**
 * Whenever the user changes the numeric input,
 * we want to immediately re-init the "deck" in the top-left corner
 * with the new number of cards (still face-down).
 */
cardCountInput.addEventListener("input", () => {
  // Re-init game with the new number
  initGame();
});

/****************************************************
 * 9) ON PAGE LOAD
 ****************************************************/
setupButtonsInitial();
initGame();
