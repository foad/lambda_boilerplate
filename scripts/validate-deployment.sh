#!/bin/bash

# Deployment Validation Script
# Validates that the GitHub Actions deployment setup is correct

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

print_status "Validating GitHub Actions deployment setup..."

# Check if workflow files exist
WORKFLOWS_DIR=".github/workflows"
REQUIRED_WORKFLOWS=("ci-cd.yml" "destroy.yml" "smoke-tests.yml")

for workflow in "${REQUIRED_WORKFLOWS[@]}"; do
    if [[ -f "$WORKFLOWS_DIR/$workflow" ]]; then
        print_success "Workflow file $workflow exists"
    else
        print_error "Missing workflow file: $workflow"
        exit 1
    fi
done

# Check if deployment setup documentation exists
if [[ -f ".github/DEPLOYMENT_SETUP.md" ]]; then
    print_success "Deployment setup documentation exists"
else
    print_error "Missing deployment setup documentation"
    exit 1
fi

# Check if setup script exists
if [[ -f "scripts/setup-aws-oidc.sh" ]] && [[ -x "scripts/setup-aws-oidc.sh" ]]; then
    print_success "AWS OIDC setup script exists and is executable"
else
    print_error "Missing or non-executable AWS OIDC setup script"
    exit 1
fi

# Check package.json for required scripts
REQUIRED_SCRIPTS=("build" "test" "test:coverage" "test:integration" "test:smoke" "lint")

if [[ -f "package.json" ]]; then
    for script in "${REQUIRED_SCRIPTS[@]}"; do
        if grep -q "\"$script\":" package.json; then
            print_success "Package.json has $script script"
        else
            print_error "Missing $script script in package.json"
            exit 1
        fi
    done
else
    print_error "Missing package.json file"
    exit 1
fi

# Check Terraform files
TERRAFORM_DIR="terraform"
REQUIRED_TF_FILES=("main.tf" "variables.tf" "outputs.tf" "lambda.tf" "api-gateway.tf" "iam.tf")

for tf_file in "${REQUIRED_TF_FILES[@]}"; do
    if [[ -f "$TERRAFORM_DIR/$tf_file" ]]; then
        print_success "Terraform file $tf_file exists"
    else
        print_error "Missing Terraform file: $tf_file"
        exit 1
    fi
done

# Check if source files exist
if [[ -d "src" ]] && [[ -n "$(find src -name "*.ts" -type f)" ]]; then
    print_success "Source TypeScript files exist"
else
    print_error "Missing source TypeScript files in src/ directory"
    exit 1
fi

# Check if tests exist
if [[ -n "$(find . -name "*.test.ts" -type f)" ]]; then
    print_success "Test files exist"
else
    print_warning "No test files found (*.test.ts)"
fi

# Check if smoke tests exist
if [[ -f "src/smoke-tests/smoke.test.ts" ]]; then
    print_success "Smoke tests exist"
else
    print_error "Missing smoke tests (src/smoke-tests/smoke.test.ts)"
    exit 1
fi

# Check if smoke test script exists
if [[ -f "scripts/run-smoke-tests.sh" ]] && [[ -x "scripts/run-smoke-tests.sh" ]]; then
    print_success "Smoke test script exists and is executable"
else
    print_error "Missing or non-executable smoke test script"
    exit 1
fi

# Check if deployment URL script exists
if [[ -f "scripts/get-deployment-urls.sh" ]] && [[ -x "scripts/get-deployment-urls.sh" ]]; then
    print_success "Deployment URL script exists and is executable"
else
    print_error "Missing or non-executable deployment URL script"
    exit 1
fi

# Validate workflow syntax (basic check)
print_status "Performing basic workflow validation..."

for workflow in "${REQUIRED_WORKFLOWS[@]}"; do
    if command -v yamllint &> /dev/null; then
        if yamllint "$WORKFLOWS_DIR/$workflow" &> /dev/null; then
            print_success "Workflow $workflow has valid YAML syntax"
        else
            print_warning "Workflow $workflow may have YAML syntax issues"
        fi
    else
        print_warning "yamllint not installed, skipping YAML validation"
        break
    fi
done

print_success "All validation checks passed!"
print_status "Next steps:"
echo "1. Run 'scripts/setup-aws-oidc.sh' to configure AWS OIDC"
echo "2. Add the generated role ARNs to GitHub repository secrets"
echo "3. Set up environment protection rules in GitHub"
echo "4. Push to 'develop' or 'main' branch to trigger deployment"
echo ""
print_success "Your GitHub Actions deployment setup is ready!"