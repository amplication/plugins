// This is the hashicorp vault config for production server
storage "raft" {
    path    = "/vault/file"
    node_id = "storage"
}

listener "tcp" {
    address     = "127.0.0.1:8200"
    tls_disable = false
}

api_addr = "http://127.0.0.1:8200"
cluster_addr = "https://127.0.0.1:8201"
ui = true
