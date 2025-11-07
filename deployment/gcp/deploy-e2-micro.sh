#!/bin/bash
set -euo pipefail

# Radicle Secure - GCP e2-micro Deployment Script
# Optimized for cost-efficient hosting ($3-8/month)

INSTANCE_NAME="${RADICLE_INSTANCE_NAME:-radicle-node}"
ZONE="${RADICLE_ZONE:-us-central1-a}"
REGION="${RADICLE_REGION:-us-central1}"
PROJECT_ID="${RADICLE_GCP_PROJECT:-}"
MACHINE_TYPE="e2-micro"
DISK_SIZE="20GB"
DISK_TYPE="pd-standard"  # HDD for cost savings

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    if ! command -v gcloud &> /dev/null; then
        log_error "gcloud CLI not found. Please install: https://cloud.google.com/sdk/install"
        exit 1
    fi

    if [ -z "$PROJECT_ID" ]; then
        log_error "Please set RADICLE_GCP_PROJECT environment variable"
        exit 1
    fi

    gcloud config set project "$PROJECT_ID"
}

# Create VM instance
create_instance() {
    log_info "Creating VM instance: $INSTANCE_NAME"

    gcloud compute instances create "$INSTANCE_NAME" \
        --machine-type="$MACHINE_TYPE" \
        --zone="$ZONE" \
        --image-family=ubuntu-2204-lts \
        --image-project=ubuntu-os-cloud \
        --boot-disk-size="$DISK_SIZE" \
        --boot-disk-type="$DISK_TYPE" \
        --tags=radicle-node \
        --metadata=startup-script='#!/bin/bash
            apt-get update
            apt-get install -y curl git build-essential
        '

    log_info "Instance created successfully"
}

# Reserve static IP
create_static_ip() {
    log_info "Creating static IP address..."

    gcloud compute addresses create "${INSTANCE_NAME}-ip" \
        --region="$REGION" || log_warn "IP address may already exist"

    STATIC_IP=$(gcloud compute addresses describe "${INSTANCE_NAME}-ip" \
        --region="$REGION" --format='value(address)')

    log_info "Static IP: $STATIC_IP"

    # Attach to instance
    gcloud compute instances add-access-config "$INSTANCE_NAME" \
        --zone="$ZONE" \
        --access-config-name="External NAT" \
        --address="$STATIC_IP" || log_warn "IP may already be attached"
}

# Configure firewall
configure_firewall() {
    log_info "Configuring firewall rules..."

    # P2P port
    gcloud compute firewall-rules create "${INSTANCE_NAME}-p2p" \
        --allow=tcp:8776 \
        --target-tags=radicle-node \
        --description="Radicle P2P port" || log_warn "Firewall rule may already exist"

    # Optional: HTTP API (restrict to your IP)
    read -p "Do you want to enable HTTP API access? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your IP address (or CIDR range): " USER_IP
        gcloud compute firewall-rules create "${INSTANCE_NAME}-api" \
            --allow=tcp:8777 \
            --source-ranges="$USER_IP" \
            --target-tags=radicle-node \
            --description="Radicle HTTP API" || log_warn "Firewall rule may already exist"
    fi
}

# Upload and install Radicle
install_radicle() {
    log_info "Uploading Secular codebase to instance..."

    # Create tarball of current directory (excluding .git, target, node_modules)
    TARBALL="/tmp/secular-${INSTANCE_NAME}.tar.gz"
    tar czf "$TARBALL" \
        --exclude='.git' \
        --exclude='target' \
        --exclude='node_modules' \
        --exclude='dist' \
        --exclude='*.bundle' \
        -C "$(dirname "$(pwd)")" "$(basename "$(pwd)")"

    log_info "Uploading $(du -h "$TARBALL" | cut -f1) tarball..."

    # Upload tarball to instance
    gcloud compute scp "$TARBALL" "$INSTANCE_NAME:/tmp/secular.tar.gz" --zone="$ZONE"

    # Clean up local tarball
    rm "$TARBALL"

    log_info "Installing Radicle on the instance..."

    gcloud compute ssh "$INSTANCE_NAME" --zone="$ZONE" --command='
        set -e

        # Install Rust
        curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        source $HOME/.cargo/env

        # Extract and build
        cd $HOME
        tar xzf /tmp/secular.tar.gz
        cd Secular
        cargo build --release

        # Install binaries
        sudo cp target/release/radicle-node /usr/local/bin/
        sudo cp target/release/rad /usr/local/bin/
        sudo cp target/release/git-remote-rad /usr/local/bin/

        # Create radicle user
        sudo useradd -r -s /bin/false radicle || true
        sudo mkdir -p /var/lib/radicle
        sudo chown radicle:radicle /var/lib/radicle

        echo "Radicle installed successfully"
    '
}

# Setup systemd
setup_systemd() {
    log_info "Setting up systemd services..."

    # Copy systemd files
    gcloud compute scp deployment/systemd/radicle-node.service \
        "$INSTANCE_NAME:/tmp/" --zone="$ZONE"
    gcloud compute scp deployment/systemd/radicle-node.socket \
        "$INSTANCE_NAME:/tmp/" --zone="$ZONE"

    gcloud compute ssh "$INSTANCE_NAME" --zone="$ZONE" --command='
        sudo cp /tmp/radicle-node.service /etc/systemd/system/
        sudo cp /tmp/radicle-node.socket /etc/systemd/system/
        sudo systemctl daemon-reload
        sudo systemctl enable radicle-node.socket
        sudo systemctl start radicle-node.socket
        sudo systemctl status radicle-node.socket
    '
}

# Print summary
print_summary() {
    log_info "Deployment complete!"
    echo ""
    echo "Instance: $INSTANCE_NAME"
    echo "Zone: $ZONE"
    echo "Static IP: $STATIC_IP"
    echo ""
    echo "Estimated monthly cost: \$3-8"
    echo ""
    echo "Next steps:"
    echo "1. SSH into the instance: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE"
    echo "2. Initialize the node: sudo -u radicle rad auth init"
    echo "3. Start the node: sudo systemctl start radicle-node"
    echo ""
}

# Main deployment
main() {
    log_info "Starting Radicle Secure deployment..."

    check_prerequisites
    create_instance
    create_static_ip
    configure_firewall
    install_radicle
    setup_systemd
    print_summary

    log_info "Deployment successful!"
}

main "$@"
