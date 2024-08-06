variable "billing_account" {
  description = "The ID of the billing account to associate projects with"
  type        = string
  default     = "${{ GLOBAL_BILLING_ACCOUNT }}"
}

variable "billing_project" {
  description = "The ID of the billing project"
  type        = string
  default     = "${{ GLOBAL_BILLING_PROJECT }}"
}

variable "organization_id" {
  description = "The organization id for the associated resources"
  type        = string
  default     = "${{ GLOBAL_ORGANISATION_ID }}"
}

variable "region_prefix" {
  description = "The region prefix identifier to be used when provisioning resources"
  type        = string
  default     = "${{ GLOBAL_REGION_PREFIX }}"
}

variable "domain" {
  description = "The domain name that is used within the organisation"
  type        = string
  default     = "${{ GLOBAL_DOMAIN }}"
}
