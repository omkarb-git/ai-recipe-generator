// DOM element references
const ingredientsInput = document.getElementById('ingredients');
const mealTypeInput = document.getElementById('mealType');
const dietaryInput = document.getElementById('dietary');
const generateBtn = document.getElementById('generateBtn');
const placeholder = document.getElementById('placeholder');
const loader = document.getElementById('loader');
const recipeResult = document.getElementById('recipeResult');
const errorDiv = document.getElementById('error');

// Event listener
generateBtn.addEventListener('click', generateRecipe);

async function generateRecipe() {
  if (ingredientsInput.value.trim() === '') {
    alert('Please enter at least one ingredient.');
    return;
  }

  showLoading(true);
  errorDiv.classList.add('hidden');

  const ingredients = ingredientsInput.value.trim();
  const mealType = mealTypeInput.value.trim();
  const dietary = dietaryInput.value.trim();

  let prompt = `Create a recipe using ONLY the following ingredients: ${ingredients}. Assume pantry staples like salt, pepper, water, and oil are available. Do not include other main ingredients.`;
  if (mealType) prompt += ` The recipe should be for ${mealType}.`;
  if (dietary) prompt += ` The recipe should also be ${dietary}.`;
  prompt += ` Provide a recipe name, short description, ingredients (with quantities), and step-by-step instructions.`;

  const schema = {
    type: "OBJECT",
    properties: {
      recipe_name: { type: "STRING" },
      description: { type: "STRING" },
      ingredients: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: { name: { type: "STRING" }, quantity: { type: "STRING" } },
          required: ["name", "quantity"]
        }
      },
      instructions: { type: "ARRAY", items: { type: "STRING" } }
    },
    required: ["recipe_name", "description", "ingredients", "instructions"]
  };

  try {
    const apiKey = "AIzaSyDLFjpf4L7ZaJN03YZeTjXfFrJ9p_8MRfI"; // Insert your Gemini API key
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`API call failed with status: ${response.status}`);

    const result = await response.json();

    if (result.candidates?.[0]?.content?.parts?.[0]) {
      const recipeJson = result.candidates[0].content.parts[0].text;
      const recipe = JSON.parse(recipeJson);
      displayRecipe(recipe);
    } else {
      throw new Error("Invalid response structure from API.");
    }
  } catch (err) {
    console.error("Error generating recipe:", err);
    showError(true);
  } finally {
    showLoading(false);
  }
}

function showLoading(isLoading) {
  generateBtn.disabled = isLoading;
  loader.style.display = isLoading ? 'flex' : 'none';
  if (isLoading) {
    placeholder.style.display = 'none';
    recipeResult.classList.add('hidden');
  }
}

function showError(isVisible) {
  errorDiv.classList.toggle('hidden', !isVisible);
  if (isVisible) placeholder.style.display = 'block';
}

function displayRecipe(recipe) {
  recipeResult.innerHTML = `
    <h2 class="text-3xl font-bold text-white mb-2">${recipe.recipe_name}</h2>
    <p class="text-gray-400 mb-6 italic">${recipe.description}</p>

    <div class="grid grid-cols-1 gap-8">
      <div>
        <h3 class="text-xl font-semibold text-gray-200 mb-4 border-b border-gray-700 pb-2">Ingredients</h3>
        <ul class="space-y-2 list-disc list-inside text-gray-300">
          ${recipe.ingredients.map(ing => `<li><strong>${ing.quantity}</strong> ${ing.name}</li>`).join('')}
        </ul>
      </div>
      <div>
        <h3 class="text-xl font-semibold text-gray-200 mb-4 border-b border-gray-700 pb-2">Instructions</h3>
        <ol class="space-y-3 text-gray-300">
          ${recipe.instructions.map((step, index) => `
            <li class="flex items-start">
              <span class="flex-shrink-0 bg-indigo-500 text-white font-bold rounded-full h-6 w-6 text-xs flex items-center justify-center mr-3 mt-1">${index + 1}</span>
              <span>${step}</span>
            </li>
          `).join('')}
        </ol>
      </div>
    </div>
  `;
  recipeResult.classList.remove('hidden');
}
