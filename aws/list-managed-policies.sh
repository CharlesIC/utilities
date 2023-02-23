#!/usr/bin/env bash
set -eu

base_dir="$(dirname "${BASH_SOURCE[0]}")"
policies_temp_file="$base_dir"/aws-managed-policies.tmp.json
policies_file="$base_dir"/aws-managed-policies.json

rm -f "$policies_file"
rm -f "$policies_temp_file"

# shopt -s lastpipe

mapfile -t policies < <(aws iam list-policies --scope AWS --query "Policies[*].[Arn, PolicyName, DefaultVersionId]" --output text)

echo "Processing ${#policies[@]} policies..."

n=0
for policy in "${policies[@]}"; do
    read -r arn name version <<<"$policy"
    document=$(aws iam get-policy-version --policy-arn "$arn" --version-id "$version" --query "PolicyVersion")
    jq --null-input --arg arn "$arn" --arg name "$name" --argjson document "$document" '{($name): {ARN: $arn, Document: $document}}' >>"$policies_temp_file"
    [[ $(($((++n)) % 10)) -eq 0 ]] && echo "Processed $n/${#policies[@]} policies..."
done

# aws iam list-policies --scope AWS --query "Policies[*].[Arn, PolicyName, DefaultVersionId]" --output text |
#     while read -r arn name version; do
#         echo "Processing policy #$((n++))..."
#         document=$(aws iam get-policy-version --policy-arn "$arn" --version-id "$version" --query "PolicyVersion")
#         policy=$(jq --null-input --arg arn "$arn" --arg name "$name" --argjson document "$document" '{($name): {ARN: $arn, Document: $document}}')
#         echo "$policy" >>"$policies_temp_file"
#     done

jq -s add "$policies_temp_file" >"$policies_file"
rm -f "$policies_temp_file"

echo "Processed $n policies"
