// This is the hashicorp vault config for dev server
ui            = true
cluster_addr  = "http://127.0.0.1:8201"
api_addr      = "htts://127.0.0.1:8200"
disable_mlock = true

storage "file" {
    path = "/vault/file/dev"
}

listener "tcp" {
    address = "127.0.0.1:8200"
    tls_disable = 1
}