#!/usr/bin/env bash
set -eu

action=$1
policies_file="$(dirname "${BASH_SOURCE[0]}")"/aws-managed-policies.json

jq --raw-output --arg action "$action" \
    'to_entries[] | {PolicyName: .key, Actions: [.value.Document.Document.Statement[].Action?] | flatten} | select(.Actions | contains([$action])) | .PolicyName' \
    "$policies_file" | sort
