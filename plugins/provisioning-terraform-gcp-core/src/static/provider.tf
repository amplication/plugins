terraform {
  required_version = ">= 1.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "4.84.0"
    }
  }
}

provider "google" {
  project               = var.billing_project
  billing_project       = var.billing_project
  user_project_override = true
}

provider "google-beta" {
  project               = var.billing_project
  billing_project       = var.billing_project
  user_project_override = true
}
