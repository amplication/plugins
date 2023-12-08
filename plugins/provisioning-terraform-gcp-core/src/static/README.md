# Terraform Google Cloud Core

This terraform code base for Google Cloud Platform, creates the infrastructure needed to run the Amplication generated service(s).

## Pre-requisites

To run the commands described in this document, you need the following:

1. Install the [Google Cloud SDK](https://cloud.google.com/sdk/install).
2. Install [Terraform](https://www.terraform.io/downloads.html).
3. Set up a Google Cloud [organization](https://cloud.google.com/resource-manager/docs/creating-managing-organization).
4. Set up a Google Cloud [billing account](https://cloud.google.com/billing/docs/how-to/manage-billing-account).
5. For the user who will run the Terraform install, grant the following roles:
   - The `roles/billing.admin` role on the billing account.
   - The `roles/resourcemanager.organizationAdmin` role on the Google Cloud organization.
   - The `roles/resourcemanager.folderCreator` role on the Google Cloud organization.
   - The `roles/resourcemanager.projectCreator` role on the Google Cloud organization.
6. Create a [Cloud Storage bucket](https://cloud.google.com/docs/terraform/resource-management/store-state) for the terraform state and point the terraform backend to this bucket - this can be done through terraform or manual manner through the console.

## Deploying

1. Run `terraform init`.
2. Run `terraform plan`.
3. Run `terraform apply`.
