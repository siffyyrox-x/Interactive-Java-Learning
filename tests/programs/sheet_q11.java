class Main {
  public static void main(String[] args) {
    int sum = 0;
    for (int i = 1; i <= 4; i++) {
      sum += i * 2;
      if (sum % 3 == 0) {
        System.out.println(sum);
      } else {
        System.out.println(i + "-" + sum);
      }
    }
    System.out.println("Final " + sum);
  }
}
