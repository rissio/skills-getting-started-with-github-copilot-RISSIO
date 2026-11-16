document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  let messageTimeout;

  function showMessage(message, status) {
    messageDiv.textContent = message;
    messageDiv.className = status;
    messageDiv.classList.remove("hidden");
    clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      if (!response.ok) {
        throw new Error("Failed to load activities");
      }
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.length = 1;

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsHeading = document.createElement("p");
        participantsHeading.className = "participants-heading";
        participantsHeading.textContent = "Participants";
        participantsSection.appendChild(participantsHeading);

        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";

        if (details.participants.length === 0) {
          const emptyMessage = document.createElement("li");
          emptyMessage.className = "participants-empty";
          emptyMessage.textContent = "No participants yet";
          participantsList.appendChild(emptyMessage);
        } else {
          details.participants.forEach((email) => {
            const participantRow = document.createElement("li");
            participantRow.className = "participant-row";

            const participantEmail = document.createElement("span");
            participantEmail.textContent = email;

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "remove-participant-button";
            removeButton.dataset.activity = name;
            removeButton.dataset.email = email;
            removeButton.setAttribute("aria-label", `Cancel signup for ${email}`);
            removeButton.title = `Cancel signup for ${email}`;
            removeButton.textContent = "×";

            participantRow.append(participantEmail, removeButton);
            participantsList.appendChild(participantRow);
          });
        }

        participantsSection.appendChild(participantsList);
        activityCard.appendChild(participantsSection);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  activitiesList.addEventListener("click", async (event) => {
    const removeButton = event.target.closest(".remove-participant-button");
    if (!removeButton) {
      return;
    }

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(removeButton.dataset.activity)}/signup?email=${encodeURIComponent(removeButton.dataset.email)}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (!response.ok) {
        showMessage(result.detail || "An error occurred", "error");
        return;
      }

      showMessage(result.message, "success");
      await fetchActivities();
    } catch (error) {
      showMessage("Failed to cancel signup. Please try again.", "error");
      console.error("Error canceling signup:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
