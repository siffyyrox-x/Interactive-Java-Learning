import java.util.Arrays;
public class Main {
  static int counter = 0;
  static int[] shared = {1, 2, 3};

  static int bump(int by) { counter += by; return counter; }

  static String grade(int m) {
    if (m >= 80) return "A";
    else if (m >= 70) return "B";
    else if (m >= 60) return "C";
    return "F";
  }

  static void modify(int[] arr, int x) {
    arr[0] = 99;
    x = 1000;
    arr = new int[] {7, 7};
  }

  static int fib(int n) { return n < 2 ? n : fib(n - 1) + fib(n - 2); }

  static double avg(int[] a) {
    int s = 0;
    for (int v : a) s += v;
    return (double) s / a.length;
  }

  static int max(int a, int b) { return a > b ? a : b; }
  static double max(double a, double b) { return a > b ? a : b; }

  public static void main(String[] args) {
    for (int d = 1; d <= 7; d++) {
      switch (d) {
        case 1: System.out.print("Mon "); break;
        case 2:
        case 3: System.out.print("Mid "); break;
        case 6: System.out.print("Sat ");
        case 7: System.out.print("Weekend "); break;
        default: System.out.print("Day" + d + " ");
      }
    }
    System.out.println();
    String cmd = "stop";
    switch (cmd) {
      case "go": System.out.println("going"); break;
      case "stop": System.out.println("stopping"); break;
      default: System.out.println("?");
    }
    char op = '*';
    switch (op) {
      case '+' -> System.out.println("plus");
      case '*' -> System.out.println("times");
      default -> System.out.println("other");
    }
    int i = 0;
    do { i += 3; } while (i < 10);
    System.out.println(i);
    int k = 100;
    do { k++; } while (k < 5);
    System.out.println(k);

    for (int a = 0; a < 1; a++) { System.out.println("labels parse"); }
    System.out.println(bump(5) + bump(2));
    System.out.println(counter);
    System.out.println(grade(85) + grade(72) + grade(64) + grade(12));
    int[] data = {1, 2};
    int x = 5;
    modify(data, x);
    System.out.println(data[0] + " " + data.length + " " + x);
    System.out.println(fib(15));
    System.out.println(avg(new int[] {70, 85, 90, 80}));
    System.out.println(max(3, 9) + " " + max(2.5, 1.0));
    System.out.println(shared[2]);
    int[][] grid = new int[3][4];
    grid[1][2] = 5;
    System.out.println(grid[1][2] + grid[0][0] + " " + grid.length + " " + grid[0].length);
    int[][] jag = {{1}, {2, 3}, {4, 5, 6}};
    int tot = 0;
    for (int r = 0; r < jag.length; r++) for (int cc = 0; cc < jag[r].length; cc++) tot += jag[r][cc];
    System.out.println(tot);
    boolean[] flags = new boolean[2];
    double[] ds = new double[2];
    String[] names = new String[2];
    char[] cs = new char[2];
    System.out.println(flags[0] + " " + ds[1] + " " + names[0] + " " + (int) cs[0]);
    int[] copy = Arrays.copyOf(new int[]{3, 1, 2}, 5);
    System.out.println(Arrays.toString(copy));
    int res = 0;
    for (int a = 1, b = 10; a < b; a++, b--) res += a * b;
    System.out.println(res);
    int n = 10;
    String label = n % 2 == 0 ? "even" : "odd";
    System.out.println(label);
    int z = 3;
    z = z++ + z++;
    System.out.println(z);
    int w = 5;
    w += w++ + ++w;
    System.out.println(w);
    int[] q = {0, 0, 0};
    int idx = 0;
    q[idx++] = idx;
    q[idx] = idx++ * 10;
    System.out.println(Arrays.toString(q) + " " + idx);
  }
}
