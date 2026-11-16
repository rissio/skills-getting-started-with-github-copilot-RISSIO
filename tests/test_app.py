from copy import deepcopy

import pytest
from fastapi.testclient import TestClient

from src.app import activities, app


@pytest.fixture
def client():
    original_activities = deepcopy(activities)
    with TestClient(app) as test_client:
        yield test_client
    activities.clear()
    activities.update(original_activities)


def test_get_activities_returns_participants(client):
    # Arrange
    activity_name = "Art Studio"

    # Act
    response = client.get("/activities")

    # Assert
    assert response.status_code == 200
    assert activity_name in response.json()
    assert "participants" in response.json()[activity_name]


def test_signup_adds_participant(client):
    # Arrange
    activity_name = "Art Studio"
    email = "new.student@example.com"

    # Act
    response = client.post(
        f"/activities/{activity_name.replace(' ', '%20')}/signup",
        params={"email": email},
    )

    # Assert
    assert response.status_code == 200
    assert email in activities[activity_name]["participants"]


def test_signup_rejects_unknown_activity(client):
    # Arrange
    activity_name = "Unknown Activity"

    # Act
    response = client.post(
        f"/activities/{activity_name.replace(' ', '%20')}/signup",
        params={"email": "student@example.com"},
    )

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_signup_rejects_duplicate_participant(client):
    # Arrange
    activity_name = "Art Studio"
    email = "existing.student@example.com"
    activities[activity_name]["participants"].append(email)

    # Act
    response = client.post(
        f"/activities/{activity_name.replace(' ', '%20')}/signup",
        params={"email": email},
    )

    # Assert
    assert response.status_code == 400
    assert activities[activity_name]["participants"].count(email) == 1


def test_cancel_signup_removes_participant(client):
    # Arrange
    activity_name = "Art Studio"
    email = "registered.student@example.com"
    activities[activity_name]["participants"].append(email)

    # Act
    response = client.delete(
        f"/activities/{activity_name.replace(' ', '%20')}/signup",
        params={"email": email},
    )

    # Assert
    assert response.status_code == 200
    assert email not in activities[activity_name]["participants"]


def test_cancel_signup_rejects_unknown_participant(client):
    # Arrange
    activity_name = "Art Studio"

    # Act
    response = client.delete(
        f"/activities/{activity_name.replace(' ', '%20')}/signup",
        params={"email": "unknown.student@example.com"},
    )

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Student is not signed up"


def test_cancel_signup_rejects_unknown_activity(client):
    # Arrange
    activity_name = "Unknown Activity"

    # Act
    response = client.delete(
        f"/activities/{activity_name.replace(' ', '%20')}/signup",
        params={"email": "student@example.com"},
    )

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"