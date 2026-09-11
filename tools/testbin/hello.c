#include <stdio.h>
#include <unistd.h>

int main(void) {
    printf("Hello from embedded ARM64 binary!\n");
    printf("PID: %d\n", getpid());
    return 0;
}
