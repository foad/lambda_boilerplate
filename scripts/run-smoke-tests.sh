#!/bin/bash

# Smoke Tests Runner Script
# Runs smoke tests against a deployed API

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -u, --url URL          API base URL (required if not set via environment)"
    echo "  -e, --environment ENV  Environment (production, development) - used to get URL from Terraform"
    echo "  -h, --help            Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  API_BASE_URL          API base URL to test against"
    echo ""
    echo "Examples:"
    echo "  $0 --url https://abc123.execute-api.eu-west-2.amazonaws.com/production"
    echo "  $0 --environment production"
    echo "  API_BASE_URL=https://abc123.execute-api.eu-west-2.amazonaws.com/production $0"
}

# Parse command line arguments
API_URL=""
ENVIRONMENT=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -u|--url)
            API_URL="$2"
            shift 2
            ;;
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Get API URL from environment variable if not provided
if [[ -z "$API_URL" && -n "$API_BASE_URL" ]]; then
    API_URL="$API_BASE_URL"
fi

# Get API URL from Terraform if environment is specified
if [[ -z "$API_URL" && -n "$ENVIRONMENT" ]]; then
    print_status "Getting API URL from Terraform for environment: $ENVIRONMENT"
    
    if [[ ! -d "terraform" ]]; then
        print_error "Terraform directory not found. Please run from project root."
        exit 1
    fi
    
    cd terraform
    
    # Check if Terraform is initialized
    if [[ ! -d ".terraform" ]]; then
        print_status "Initializing Terraform..."
        terraform init
    fi
    
    # Get the API URL from Terraform output
    API_URL=$(terraform output -raw api_gateway_url 2>/dev/null || echo "")
    
    cd ..
    
    if [[ -z "$API_URL" ]]; then
        print_error "Could not get API URL from Terraform. Make sure infrastructure is deployed."
        exit 1
    fi
fi

# Validate that we have an API URL
if [[ -z "$API_URL" ]]; then
    print_error "API URL is required. Use --url, --environment, or set API_BASE_URL environment variable."
    show_usage
    exit 1
fi

print_status "Running smoke tests against: $API_URL"

# Check if dependencies are installed
if [[ ! -d "node_modules" ]]; then
    print_status "Installing dependencies..."
    npm ci
fi

# Export the API URL for the tests
export API_BASE_URL="$API_URL"

# Run the smoke tests
print_status "Executing smoke tests..."

if npm run test:smoke; then
    print_success "All smoke tests passed! 🎉"
    print_success "API at $API_URL is healthy and responding correctly."
else
    print_error "Smoke tests failed! ❌"
    print_error "API at $API_URL may have issues."
    print_error ""
    print_error "Common issues to check:"
    print_error "- API Gateway is deployed and accessible"
    print_error "- Lambda functions are working correctly"
    print_error "- DynamoDB table exists and is accessible"
    print_error "- IAM permissions are correctly configured"
    exit 1
fi