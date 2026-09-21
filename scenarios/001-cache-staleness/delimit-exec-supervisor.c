#define _GNU_SOURCE

#include <ctype.h>
#include <errno.h>
#include <fcntl.h>
#include <grp.h>
#include <limits.h>
#include <poll.h>
#include <signal.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/prctl.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <time.h>
#include <unistd.h>

#define CANDIDATE_UID 1000
#define CANDIDATE_GID 1000
#define CLEANUP_TIMEOUT_MS 5000
#define SETUP_TIMEOUT_MS 5000
#define MAX_COMMAND_BYTES 4096
#define MAX_TOKEN_BYTES 128

static long long monotonic_ms(void) {
  struct timespec now;
  if (clock_gettime(CLOCK_MONOTONIC, &now) != 0) return -1;
  return (long long)now.tv_sec * 1000 + now.tv_nsec / 1000000;
}

static void sleep_ms(long milliseconds) {
  const struct timespec delay = {
      .tv_sec = milliseconds / 1000,
      .tv_nsec = (milliseconds % 1000) * 1000000,
  };
  nanosleep(&delay, NULL);
}

static bool valid_token(const char *token) {
  const size_t length = strlen(token);
  if (length == 0 || length > MAX_TOKEN_BYTES) return false;
  for (size_t i = 0; i < length; i++) {
    if (!isalnum((unsigned char)token[i]) && token[i] != '-' && token[i] != '_')
      return false;
  }
  return true;
}

static int write_status(int fd, const char *status) {
  const size_t length = strlen(status);
  const ssize_t written = write(fd, status, length);
  if (written != (ssize_t)length) {
    if (written >= 0) errno = EIO;
    return -1;
  }
  return 0;
}

static bool unprivileged_identity(void) {
  uid_t real_uid, effective_uid, saved_uid;
  gid_t real_gid, effective_gid, saved_gid;
  if (getresuid(&real_uid, &effective_uid, &saved_uid) != 0 ||
      getresgid(&real_gid, &effective_gid, &saved_gid) != 0)
    return false;
  return real_uid == CANDIDATE_UID && effective_uid == CANDIDATE_UID &&
         saved_uid == CANDIDATE_UID && real_gid == CANDIDATE_GID &&
         effective_gid == CANDIDATE_GID && saved_gid == CANDIDATE_GID;
}

static bool capabilities_empty(void) {
  FILE *file = fopen("/proc/self/status", "r");
  if (file == NULL) return false;

  char line[256];
  bool effective_empty = false;
  bool permitted_empty = false;
  while (fgets(line, sizeof(line), file) != NULL) {
    unsigned long long value;
    if (sscanf(line, "CapEff:\t%llx", &value) == 1)
      effective_empty = value == 0;
    if (sscanf(line, "CapPrm:\t%llx", &value) == 1)
      permitted_empty = value == 0;
  }
  const bool read_ok = !ferror(file);
  fclose(file);
  return read_ok && effective_empty && permitted_empty;
}

static void child_setup_failed(int fd) {
  const int error_number = errno;
  (void)write(fd, &error_number, sizeof(error_number));
  _exit(125);
}

static int read_direct_children(pid_t *children, size_t capacity) {
  char path[128];
  snprintf(path, sizeof(path), "/proc/self/task/%ld/children", (long)getpid());

  FILE *file = fopen(path, "r");
  if (file == NULL) return -1;

  size_t count = 0;
  long pid;
  while (fscanf(file, "%ld", &pid) == 1) {
    if (count == capacity || pid <= 0 || pid > INT_MAX) {
      fclose(file);
      errno = EOVERFLOW;
      return -1;
    }
    children[count++] = (pid_t)pid;
  }

  if (ferror(file)) {
    const int saved_errno = errno;
    fclose(file);
    errno = saved_errno;
    return -1;
  }
  fclose(file);
  return (int)count;
}

static bool reap_and_kill_all(pid_t command_pid) {
  (void)kill(-command_pid, SIGKILL);
  (void)kill(command_pid, SIGKILL);

  const long long end = monotonic_ms() + CLEANUP_TIMEOUT_MS;
  while (monotonic_ms() <= end) {
    int status;
    while (waitpid(-1, &status, WNOHANG) > 0) {
    }
    if (errno != 0 && errno != ECHILD) errno = 0;

    pid_t children[256];
    const int count = read_direct_children(children, 256);
    if (count < 0) return false;
    if (count == 0) {
      const pid_t remaining = waitpid(-1, &status, WNOHANG);
      if (remaining < 0 && errno == ECHILD) return true;
      if (remaining > 0) continue;
    }

    for (int i = 0; i < count; i++) {
      if (kill(children[i], SIGKILL) != 0 && errno != ESRCH) return false;
    }
    sleep_ms(10);
  }
  return false;
}

static int mapped_exit_status(int status) {
  if (WIFEXITED(status)) return WEXITSTATUS(status);
  if (WIFSIGNALED(status)) return 128 + WTERMSIG(status);
  return 125;
}

int main(int argc, char **argv) {
  if (argc != 5 || geteuid() != 0 || getegid() != 0 || !valid_token(argv[3]) ||
      strlen(argv[4]) > MAX_COMMAND_BYTES) {
    fputs("command supervisor rejected invalid invocation\n", stderr);
    return 125;
  }

  char *end = NULL;
  errno = 0;
  const long timeout_ms = strtol(argv[1], &end, 10);
  if (errno != 0 || end == argv[1] || *end != '\0' || timeout_ms < 0) {
    fputs("command supervisor rejected invalid timeout\n", stderr);
    return 125;
  }

  char status_path[PATH_MAX];
  const int path_length = snprintf(status_path, sizeof(status_path),
                                   "/run/delimit-evidence/command-%s.status",
                                   argv[3]);
  if (path_length < 0 || path_length >= (int)sizeof(status_path)) return 125;
  if (unlink(status_path) != 0 && errno != ENOENT) return 125;

  const int status_fd =
      open(status_path, O_WRONLY | O_CREAT | O_EXCL | O_CLOEXEC | O_NOFOLLOW,
           0600);
  if (status_fd < 0) return 125;

  if (prctl(PR_SET_DUMPABLE, 0) != 0 ||
      prctl(PR_SET_CHILD_SUBREAPER, 1, 0, 0, 0) != 0) {
    (void)write_status(status_fd, "platform\n");
    close(status_fd);
    return 125;
  }

  if (setgroups(0, NULL) != 0 ||
      setresgid(CANDIDATE_GID, CANDIDATE_GID, CANDIDATE_GID) != 0 ||
      setresuid(CANDIDATE_UID, CANDIDATE_UID, CANDIDATE_UID) != 0 ||
      !unprivileged_identity() || !capabilities_empty()) {
    (void)write_status(status_fd, "platform\n");
    close(status_fd);
    return 125;
  }

  int setup_pipe[2];
  if (pipe2(setup_pipe, O_CLOEXEC) != 0) {
    (void)write_status(status_fd, "platform\n");
    close(status_fd);
    return 125;
  }

  const long long started_at = monotonic_ms();
  const pid_t command_pid = fork();
  if (command_pid < 0) {
    close(setup_pipe[0]);
    close(setup_pipe[1]);
    (void)write_status(status_fd, "platform\n");
    close(status_fd);
    return 125;
  }

  if (command_pid == 0) {
    close(status_fd);
    close(setup_pipe[0]);
    if (setsid() < 0) child_setup_failed(setup_pipe[1]);
    if (chdir(argv[2]) != 0) child_setup_failed(setup_pipe[1]);

    execl("/bin/sh", "sh", "-c", argv[4], (char *)NULL);
    child_setup_failed(setup_pipe[1]);
  }

  close(setup_pipe[1]);
  struct pollfd setup_poll = {.fd = setup_pipe[0], .events = POLLIN | POLLHUP};
  const int poll_result = poll(&setup_poll, 1, SETUP_TIMEOUT_MS);
  int setup_errno = 0;
  const ssize_t setup_bytes = poll_result > 0
                                  ? read(setup_pipe[0], &setup_errno,
                                         sizeof(setup_errno))
                                  : -1;
  close(setup_pipe[0]);
  if (poll_result <= 0 || setup_bytes > 0) {
    (void)reap_and_kill_all(command_pid);
    (void)write_status(status_fd, "platform\n");
    close(status_fd);
    return 125;
  }

  if (timeout_ms == 0) {
    int status;
    if (waitpid(command_pid, &status, 0) != command_pid) {
      (void)write_status(status_fd, "platform\n");
      close(status_fd);
      return 125;
    }
    char result[32];
    const int exit_code = mapped_exit_status(status);
    snprintf(result, sizeof(result), "exit:%d\n", exit_code);
    if (write_status(status_fd, result) != 0) return 125;
    if (close(status_fd) != 0) return 125;
    return exit_code;
  }

  const long long timeout_at = started_at + timeout_ms;
  while (monotonic_ms() < timeout_at) {
    int status;
    pid_t reaped;
    while ((reaped = waitpid(-1, &status, WNOHANG)) > 0) {
      if (reaped == command_pid) {
        char result[32];
        const int exit_code = mapped_exit_status(status);
        snprintf(result, sizeof(result), "exit:%d\n", exit_code);
        if (write_status(status_fd, result) != 0) return 125;
        if (close(status_fd) != 0) return 125;
        return exit_code;
      }
    }
    if (reaped < 0 && errno == ECHILD) {
      (void)write_status(status_fd, "platform\n");
      close(status_fd);
      return 125;
    }
    sleep_ms(5);
  }

  if (!reap_and_kill_all(command_pid)) {
    (void)write_status(status_fd, "platform\n");
    close(status_fd);
    return 125;
  }
  if (write_status(status_fd, "timeout\n") != 0) return 125;
  if (close(status_fd) != 0) return 125;
  return 124;
}
