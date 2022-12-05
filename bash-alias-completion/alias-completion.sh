for a in "${!BASH_ALIASES[@]}"; do
    cmd=$(cut -d" " -f1 <<<"${BASH_ALIASES[$a]}")
    echo "$a | ${BASH_ALIASES[$a]} | $cmd | $(type -t "$cmd")"
done
