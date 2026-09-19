class Main {
  public static void main(String[] args) {
    int n = 5724;
    int sum = 0;
    int sign = 1;
    while (n > 0) {
      int d = n % 10;
      sum += d * sign;
      System.out.println(d + ":" + sum);
      sign = -sign;
      n /= 10;
    }
    System.out.println(sum);
  }
}
